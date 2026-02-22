import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, pushMessage, LineWebhookBody, LineWebhookEvent, type LineCredentials } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { searchKnowledgeWithSources } from '@/lib/knowledge-search';
import { getOrCreateContactByLineUserId, getUserSettings, insertConversationMessage, getRecentConversationMessages, type Contact } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getConversationUsageForUser } from '@/lib/billing-usage';
import { autoTagContact } from '@/lib/auto-tag';
import { isProcessed, markAsProcessed } from '@/lib/idempotency';
import { checkRateLimit } from '@/lib/rate-limit';
import { invalidateAnalyticsCache } from '@/lib/analytics-cache';
import { detectSensitiveKeywords } from '@/lib/security/sensitive-keywords';
import { isWithinBusinessHours } from '@/lib/business-hours';
import { summarizeConversation } from '@/lib/conversation-summary';
import { WorkflowEngine, type WorkflowData } from '@/lib/workflow-engine';
import { storeSentimentAndAlert } from '@/lib/sentiment';
import {
  decideReplyAction,
  getDefaultHandoffText,
  type ReplyDecisionSource,
} from '@/lib/ai/reply-decision';

const KNOWLEDGE_PREFIX =
  '\n\n## 以下是你可以參考的知識庫內容（只能根據以下內容回答，勿使用其他知識）：\n';
const KNOWLEDGE_EMPTY_INSTRUCTION =
  '\n\n注意：知識庫中沒有找到與此問題相關的內容，請回覆需要轉接專人，勿自行編造答案。';
const SENSITIVE_CONTENT_REPLY = '此問題涉及敏感內容，建議聯繫人工客服。';
const GUARDRAIL_SAFE_REPLY = '感謝您的詢問！此問題需要專員處理，我已為您記錄，會盡快回覆您。';
const SUGGEST_ACK_REPLY = '已收到您的訊息，我們會由專員確認後盡快回覆您。';

const FORBIDDEN_PATTERNS = [
  /免費送你/,
  /我可以給你.*折/,
  /退.*全額/,
  /保證.*效果/,
  /我不是AI/,
  /我是真人/,
];
const MAX_REPLY_LENGTH = 500;

const HUMAN_HANDOFF_KEYWORDS = [
  '找真人',
  '轉人工',
  '客服人員',
  '真人客服',
  '投訴',
  '申訴',
  '不滿意',
  '太差了',
  '什麼爛',
  '退款',
  '退錢',
  '賠償',
  'human',
  'agent',
  'real person',
  'complaint',
];
const AI_HANDOFF_PHRASES = ['轉交給專人', '需要專員處理', '轉接人工'];

const NEEDS_HUMAN_KEYWORDS = /不確定|無法回答|請聯繫|請聯絡|抱歉我不清楚|抱歉我無法|轉人工|真人客服/;

/** Stable id for idempotency: prefer webhookEventId, then message.id, then replyToken. */
function getEventId(event: LineWebhookEvent): string {
  return (
    event.webhookEventId ??
    event.message?.id ??
    (event.replyToken ? `token:${event.replyToken}` : `ts:${event.timestamp}:${event.source?.userId ?? 'unknown'}`)
  );
}

function computeResolution(
  sourcesLength: number,
  aiReply: string
): { status: string; resolved_by: string; is_resolved: boolean } {
  if (sourcesLength === 0 || NEEDS_HUMAN_KEYWORDS.test(aiReply)) {
    return { status: 'needs_human', resolved_by: 'unresolved', is_resolved: false };
  }
  return { status: 'ai_handled', resolved_by: 'ai', is_resolved: true };
}

function applyReplyGuardrail(reply: string): { safeReply: string; guardrailTriggered: boolean } {
  let safeReply = reply;
  let guardrailTriggered = false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(reply)) {
      safeReply = GUARDRAIL_SAFE_REPLY;
      guardrailTriggered = true;
      break;
    }
  }
  if (safeReply.length > MAX_REPLY_LENGTH) {
    safeReply = safeReply.substring(0, MAX_REPLY_LENGTH - 3) + '...';
  }
  return { safeReply, guardrailTriggered };
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!validateSignature(body, signature)) {
      console.warn('[LINE webhook] Invalid signature', { requestId });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookBody: LineWebhookBody = JSON.parse(body);
    const events = webhookBody.events ?? [];

    if (events.length === 0) {
      return NextResponse.json({ success: true });
    }

    const eventIds = events.map(getEventId);
    console.info('[LINE webhook] Request', {
      requestId,
      eventCount: events.length,
      eventIds: eventIds.slice(0, 5),
      destination: webhookBody.destination,
    });

    let hasEventErrors = false;
    for (const event of events) {
      try {
        await handleEvent(event, requestId);
      } catch (eventError) {
        hasEventErrors = true;
        console.error('[LINE webhook] Event failed', {
          requestId,
          eventId: getEventId(event),
          error: eventError instanceof Error ? eventError.message : String(eventError),
        });
      }
    }

    if (hasEventErrors) {
      return NextResponse.json({ success: false, error: 'partial_failure' }, { status: 500 });
    }

    console.info('[LINE webhook] Success', {
      requestId,
      durationMs: Date.now() - start,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE webhook] Error', {
      requestId,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'webhook_failed' }, { status: 500 });
  }
}

const REPLY_IMAGE_UNSUPPORTED = '目前不支援圖片，請用文字描述您的問題。';
const REPLY_STICKER = '感謝您傳送貼圖 😊';
const REPLY_LOCATION_RECEIVED = '已收到您的位置資訊，感謝。';

export type WebhookLineOverrides = {
  ownerUserId: string;
  credentials?: LineCredentials;
  botId?: string;
};

export async function handleEvent(
  event: LineWebhookEvent,
  requestId: string,
  overrides?: WebhookLineOverrides
): Promise<void> {
  const replyToken = event.replyToken;
  const lineUserId = event.source?.userId;
  const ownerUserId = overrides?.ownerUserId ?? process.env.LINE_OWNER_USER_ID;
  const creds = overrides?.credentials;
  const botId = overrides?.botId;

  // Sprint 10: follow event - welcome message
  if (event.type === 'follow' && lineUserId && ownerUserId && replyToken) {
    try {
      const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);
      const settings = await getUserSettings(ownerUserId);
      if (settings.welcome_message_enabled && settings.welcome_message) {
        await replyMessage(replyToken, settings.welcome_message, undefined, creds);
      }
    } catch (e) {
      console.error('[LINE webhook] Welcome message failed', { requestId, error: e });
    }
    return;
  }

  // Sprint 8: postback - feedback
  if (event.type === 'postback' && event.postback?.data?.startsWith('feedback:') && lineUserId && ownerUserId) {
    const [, rating, convId] = event.postback.data.split(':');
    if ((rating === 'positive' || rating === 'negative') && convId) {
      try {
        const admin = getSupabaseAdmin();
        const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);
        await admin.from('ai_feedback').insert({
          user_id: ownerUserId,
          contact_id: contact.id,
          conversation_id: convId,
          rating: rating === 'positive' ? 'positive' : 'negative',
        });
        if (replyToken) {
          await replyMessage(replyToken, rating === 'positive' ? '感謝您的回饋！😊' : '感謝您的回饋，我們會持續改進！', undefined, creds);
        }
      } catch (e) {
        console.warn('[LINE webhook] Feedback insert failed', { requestId, error: e });
      }
    }
    return;
  }

  if (event.type !== 'message' || !event.message) {
    return;
  }

  if (!replyToken) return;

  const msg = event.message;
  const msgType = msg.type;
  const eventId = getEventId(event);
  if (await isProcessed(eventId)) {
    console.info('[LINE webhook] Duplicate event skipped', { requestId, eventId });
    return;
  }

  // Non-text message types: reply once and mark processed
  if (msgType === 'image') {
    try {
      await replyMessage(replyToken, REPLY_IMAGE_UNSUPPORTED, undefined, creds);
    } catch (e) {
      console.error('[LINE webhook] Failed to send image-unsupported reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(eventId, botId);
    } catch {
      // ignore
    }
    return;
  }

  if (msgType === 'sticker') {
    try {
      await replyMessage(replyToken, REPLY_STICKER, undefined, creds);
    } catch (e) {
      console.error('[LINE webhook] Failed to send sticker reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(eventId, botId);
    } catch {
      // ignore
    }
    return;
  }

  if (msgType === 'location') {
    try {
      await replyMessage(replyToken, REPLY_LOCATION_RECEIVED, undefined, creds);
    } catch (e) {
      console.error('[LINE webhook] Failed to send location reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(eventId, botId);
    } catch {
      // ignore
    }
    return;
  }

  if (msgType !== 'text') {
    return;
  }

  const userMessage = msg.text;
  if (!userMessage || !lineUserId) {
    return;
  }

  if (await isProcessed(eventId, botId)) {
    console.info('[LINE webhook] Duplicate event skipped', { requestId, eventId });
    return;
  }

  const { allowed: rateLimitOk, remaining, resetAt } = await checkRateLimit(lineUserId);
  if (!rateLimitOk) {
    console.warn('[LINE webhook] Rate limit exceeded', { requestId, lineUserId, remaining, resetAt: resetAt.toISOString() });
    try {
      await replyMessage(replyToken, '您發送訊息的頻率過高，請稍後再試。', undefined, creds);
    } catch {
      // ignore
    }
    return;
  }

  const sensitiveCheck = detectSensitiveKeywords(userMessage);
  if (sensitiveCheck.riskLevel !== 'low') {
    console.info('[LINE webhook] Sensitive message detected', {
      requestId,
      eventId,
      riskLevel: sensitiveCheck.riskLevel,
      keywords: sensitiveCheck.keywords.slice(0, 5),
    });
    if (ownerUserId && lineUserId) {
      try {
        const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);
        await insertConversationMessage(contact.id, userMessage, 'user');
        await insertConversationMessage(contact.id, SENSITIVE_CONTENT_REPLY, 'assistant', {
          status: 'needs_human',
          resolved_by: 'policy',
          is_resolved: false,
        });
      } catch (auditErr) {
        console.error('[LINE webhook] Sensitive-branch audit write failed', {
          requestId,
          eventId,
          error: auditErr instanceof Error ? auditErr.message : String(auditErr),
        });
      }
    }
    try {
      await replyMessage(replyToken, SENSITIVE_CONTENT_REPLY, undefined, creds);
    } catch (replyError) {
      console.error('[LINE webhook] Failed to send sensitive-content reply', {
        requestId,
        eventId,
        error: replyError instanceof Error ? replyError.message : String(replyError),
      });
    }
    try {
      await markAsProcessed(eventId, botId);
    } catch (markError) {
      console.error('[LINE webhook] Failed to mark sensitive event processed', {
        requestId,
        eventId,
        error: markError instanceof Error ? markError.message : String(markError),
      });
    }
    return;
  }

  if (!ownerUserId) {
    console.error('LINE_OWNER_USER_ID is not set');
    try {
      await replyMessage(replyToken, '抱歉，服務設定有誤，請稍後再試。', undefined, creds);
    } catch {
      // ignore
    }
    return;
  }

  let contact: Contact | null = null;
  try {
    const admin = getSupabaseAdmin();
    const { limit, used } = await getConversationUsageForUser(admin, ownerUserId);
    if (limit !== -1 && used >= limit) {
      await replyMessage(replyToken, '很抱歉，本月對話額度已用完，請聯繫商家。', undefined, creds);
      return;
    }

    contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);

    const settings = await getUserSettings(ownerUserId);
    const {
      system_prompt: systemPrompt,
      ai_model: aiModel,
      custom_sensitive_words: customSensitiveWords = [],
      sensitive_word_reply: sensitiveWordReply,
      max_reply_length: maxReplyLength,
      reply_temperature: replyTemperature,
      reply_format: replyFormat,
      auto_detect_language: autoDetectLanguage,
      supported_languages: supportedLanguages,
      fallback_language: fallbackLanguage,
      reply_delay_seconds: replyDelaySeconds = 0,
      quick_replies: quickReplies = [],
    } = settings;

    // 自動化工作流程：若有 workflow 觸發則執行並 return
    const { data: workflows } = await admin
      .from('workflows')
      .select('id, name, nodes, edges')
      .eq('user_id', ownerUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (workflows && workflows.length > 0) {
      const { count } = await admin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', contact.id);
      const isNewCustomer = (count ?? 0) === 0;
      const bhEnabled = settings?.business_hours_enabled ?? false;
      const bhConfig = settings?.business_hours ?? null;
      const isOffHours = !!bhEnabled && !isWithinBusinessHours(bhConfig);

      for (const w of workflows) {
        const nodes = (w.nodes ?? []) as WorkflowData['nodes'];
        const edges = (w.edges ?? []) as WorkflowData['edges'];
        const triggerNodes = nodes.filter(
          (n) => n.type === 'trigger' && !edges.some((e) => e.target === n.id)
        );
        if (triggerNodes.length === 0) continue;

        const trigger = triggerNodes[0];
        const subType = trigger.data?.subType ?? 'new_message';
        let shouldTrigger = false;
        if (subType === 'new_message') shouldTrigger = true;
        else if (subType === 'keywords') {
          const keywords = (trigger.data?.keywords ?? []) as string[];
          if (keywords.length === 0) shouldTrigger = true;
          else shouldTrigger = keywords.some((k) =>
            userMessage.toLowerCase().includes(String(k).toLowerCase())
          );
        } else if (subType === 'new_customer') shouldTrigger = isNewCustomer;
        else if (subType === 'off_hours') shouldTrigger = isOffHours;

        if (!shouldTrigger) continue;

        const result = await WorkflowEngine.execute(
          { id: w.id, name: w.name, nodes, edges },
          {
            message: userMessage,
            contactId: contact.id,
            lineUserId,
            ownerUserId,
            replyToken,
            isNewCustomer,
            isOffHours,
            businessHoursConfig: bhConfig,
            systemPrompt: systemPrompt ?? undefined,
            aiModel: aiModel ?? undefined,
            variables: {},
          }
        );

        await admin.from('workflow_logs').insert({
          workflow_id: w.id,
          status: result.success ? 'success' : 'failed',
          executed_nodes: result.executedNodes,
          error: result.error ?? null,
        });

        await markAsProcessed(eventId, botId);
        void invalidateAnalyticsCache(ownerUserId);
        return;
      }
    }

    // Sprint 2: 自訂敏感詞檢查（在內建敏感詞之後）
    const customMatch = customSensitiveWords?.some((word: string) =>
      userMessage.toLowerCase().includes(String(word).toLowerCase())
    );
    if (customMatch) {
      await replyMessage(replyToken, sensitiveWordReply || SENSITIVE_CONTENT_REPLY, undefined, creds);
      await markAsProcessed(eventId, botId);
      return;
    }

    // Sprint 7: 營業時間
    const {
      business_hours_enabled: businessHoursEnabled,
      business_hours: businessHours,
      outside_hours_mode: outsideHoursMode,
      outside_hours_message: outsideHoursMessage,
      confidence_threshold: confidenceThreshold = 0.6,
      handoff_message: handoffMessage,
      feedback_enabled: feedbackEnabled,
      feedback_message: feedbackMessage,
      conversation_memory_count: memoryCount = 5,
      conversation_memory_mode: memoryMode,
    } = settings;

    if (businessHoursEnabled && !isWithinBusinessHours(businessHours)) {
      if (outsideHoursMode === 'auto_reply') {
        await replyMessage(replyToken, outsideHoursMessage || '感謝您的訊息！目前為非營業時間，我們將在營業時間盡快回覆您。', undefined, creds);
        await markAsProcessed(eventId, botId);
        return;
      }
      if (outsideHoursMode === 'collect_info') {
        await replyMessage(replyToken, (outsideHoursMessage || '') + '\n\n請留下您的問題，我們會在營業時間回覆您：', undefined, creds);
        await insertConversationMessage(contact.id, userMessage, 'user');
        await markAsProcessed(eventId, botId);
        return;
      }
    }

    const userConv = await insertConversationMessage(contact.id, userMessage, 'user');
    if (userConv?.id) {
      void storeSentimentAndAlert(
        userConv.id,
        contact.id,
        ownerUserId,
        userMessage,
        contact.name ?? null
      );
    }

    const { text: knowledgeText, sources } = await searchKnowledgeWithSources(
      ownerUserId,
      userMessage,
      3,
      2000
    );

    // Sprint 12: A/B test
    let effectiveSystemPrompt = systemPrompt?.trim() ?? '';
    const { data: runningTest } = await admin
      .from('ab_tests')
      .select('id, variant_a_prompt, variant_b_prompt, traffic_split')
      .eq('user_id', ownerUserId)
      .eq('status', 'running')
      .maybeSingle();

    let abTestId: string | undefined;
    let abVariant: string | undefined;
    if (runningTest) {
      const { data: assignment } = await admin
        .from('ab_test_assignments')
        .select('variant')
        .eq('ab_test_id', runningTest.id)
        .eq('contact_id', contact.id)
        .maybeSingle();
      let variant: 'A' | 'B';
      if (assignment?.variant) {
        variant = assignment.variant as 'A' | 'B';
      } else {
        variant = Math.random() * 100 < (runningTest.traffic_split ?? 50) ? 'A' : 'B';
        await admin.from('ab_test_assignments').insert({
          ab_test_id: runningTest.id,
          contact_id: contact.id,
          variant,
        });
      }
      effectiveSystemPrompt =
        variant === 'A' ? runningTest.variant_a_prompt : runningTest.variant_b_prompt;
      abTestId = runningTest.id;
      abVariant = variant;
    }

    const basePrompt = knowledgeText
      ? effectiveSystemPrompt + KNOWLEDGE_PREFIX + knowledgeText
      : effectiveSystemPrompt + KNOWLEDGE_EMPTY_INSTRUCTION;

    const { data: guidanceRules } = await admin
      .from('ai_guidance_rules')
      .select('rule_title, rule_content')
      .eq('user_id', ownerUserId)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });
    const guidance = (guidanceRules ?? []).map((r) => ({
      rule_title: r.rule_title,
      rule_content: r.rule_content,
    }));

    const decisionSources: ReplyDecisionSource[] = sources.map((source) => ({
      id: source.id,
      title: source.title,
      category: source.category,
    }));

    let decision = decideReplyAction({
      userMessage,
      userId: ownerUserId,
      contactId: contact.id,
      sourcesCount: sources.length,
      riskDetection: sensitiveCheck,
      settings: { confidence_threshold: confidenceThreshold },
      sources: decisionSources,
    });

    const shouldGenerateDraft = decision.action === 'AUTO' || decision.action === 'SUGGEST';
    let guardrailTriggered = false;
    if (shouldGenerateDraft) {
      const count = Math.max(1, Math.min(30, memoryCount ?? 5));
      let recentMessages: { role: 'user' | 'assistant'; content: string }[];
      if (memoryMode === 'summary' && count > 10) {
        const allRecent = await getRecentConversationMessages(contact.id, count);
        if (allRecent.length > 3) {
          const toSummarize = allRecent.slice(0, -3);
          const keepRecent = allRecent.slice(-3);
          const summary = await summarizeConversation(toSummarize);
          recentMessages = [
            { role: 'assistant' as const, content: `【前面對話摘要】${summary}` },
            ...keepRecent,
          ];
        } else {
          recentMessages = allRecent;
        }
      } else {
        recentMessages = await getRecentConversationMessages(contact.id, count);
      }

      const aiResponse = await generateReply(
        userMessage,
        basePrompt,
        aiModel,
        ownerUserId,
        contact.id,
        recentMessages,
        {
          maxReplyLength,
          replyTemperature,
          replyFormat,
          autoDetectLanguage,
          supportedLanguages,
          fallbackLanguage,
          guidanceRules: guidance,
        }
      );
      const guardrail = applyReplyGuardrail(aiResponse);
      guardrailTriggered = guardrail.guardrailTriggered;
      decision = decideReplyAction({
        userMessage,
        userId: ownerUserId,
        contactId: contact.id,
        sourcesCount: sources.length,
        riskDetection: sensitiveCheck,
        settings: { confidence_threshold: confidenceThreshold },
        sources: decisionSources,
        candidateDraft: guardrail.safeReply,
      });
    }

    // Sprint 3: 回覆延遲（模擬真人打字）
    const delayMs = (replyDelaySeconds ?? 0) * 1000;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const enabledQuickReplies = (quickReplies ?? [])
      .filter((qr: { enabled?: boolean; text?: string }) => qr.enabled !== false && (qr.text ?? '').trim())
      .map((qr: { text?: string }) => ({
        label: (qr.text ?? '').trim().substring(0, 20),
        text: (qr.text ?? '').trim(),
      }));

    let insertedAssistant:
      | Awaited<ReturnType<typeof insertConversationMessage>>
      | null = null;

    if (decision.action === 'AUTO') {
      await replyMessage(
        replyToken,
        decision.draftText,
        enabledQuickReplies.length > 0 ? enabledQuickReplies : undefined,
        creds
      );

      const needsHumanFromUser = HUMAN_HANDOFF_KEYWORDS.some((keyword) =>
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      );
      const needsHumanFromAi = AI_HANDOFF_PHRASES.some((phrase) =>
        decision.draftText.includes(phrase)
      );
      const needsHuman = guardrailTriggered || needsHumanFromUser || needsHumanFromAi;
      const resolution = needsHuman
        ? { status: 'needs_human' as const, resolved_by: 'unresolved', is_resolved: false }
        : computeResolution(sources.length, decision.draftText);

      insertedAssistant = await insertConversationMessage(
        contact.id,
        decision.draftText,
        'assistant',
        {
          status: resolution.status,
          resolved_by: resolution.resolved_by,
          is_resolved: resolution.is_resolved,
          confidence_score: decision.confidence,
          ab_test_id: abTestId,
          ab_variant: abVariant,
        }
      );

      if (feedbackEnabled && insertedAssistant?.id && lineUserId) {
        try {
          const feedbackText = feedbackMessage || '這個回覆有幫助嗎？';
          await pushMessage(lineUserId, {
            type: 'template',
            altText: feedbackText,
            template: {
              type: 'confirm',
              text: feedbackText,
              actions: [
                { type: 'postback', label: '👍 有幫助', data: `feedback:positive:${insertedAssistant.id}` },
                { type: 'postback', label: '👎 沒幫助', data: `feedback:negative:${insertedAssistant.id}` },
              ],
            },
          }, creds);
        } catch (e) {
          console.warn('[LINE webhook] Feedback push failed', { requestId, error: e });
        }
      }
    } else if (decision.action === 'SUGGEST') {
      const { error: suggestionError } = await admin.from('ai_suggestions').insert({
        user_id: ownerUserId,
        contact_id: contact.id,
        bot_id: botId ?? null,
        event_id: eventId,
        user_message: userMessage,
        suggested_reply: decision.draftText,
        sources_count: decision.sources?.count ?? 0,
        confidence_score: decision.confidence ?? null,
        risk_category: decision.category,
        category: decision.category,
        sources: {
          count: decision.sources.count,
          titles: decision.sources.titles,
          items: decisionSources,
        },
        status: 'draft',
      });
      if (suggestionError) {
        console.error('[LINE webhook] ai_suggestions insert failed', {
          requestId,
          eventId,
          contact_id: contact.id,
          code: suggestionError.code,
        });
        throw suggestionError;
      }

      await replyMessage(replyToken, SUGGEST_ACK_REPLY, undefined, creds);
      insertedAssistant = await insertConversationMessage(
        contact.id,
        SUGGEST_ACK_REPLY,
        'assistant',
        {
          status: 'needs_human',
          resolved_by: 'unresolved',
          is_resolved: false,
          confidence_score: decision.confidence,
          ab_test_id: abTestId,
          ab_variant: abVariant,
        }
      );
    } else if (decision.action === 'ASK') {
      const askText = decision.askText || decision.draftText;
      await replyMessage(replyToken, askText, undefined, creds);
      const askNeedsHuman = ['refund', 'discount', 'price', 'shipping', 'delivery', 'complaint'].includes(
        decision.category
      );
      insertedAssistant = await insertConversationMessage(contact.id, askText, 'assistant', {
        status: askNeedsHuman ? 'needs_human' : 'ai_handled',
        resolved_by: askNeedsHuman ? 'unresolved' : 'ai',
        is_resolved: !askNeedsHuman,
        confidence_score: decision.confidence,
        ab_test_id: abTestId,
        ab_variant: abVariant,
      });
    } else {
      const handoffText = handoffMessage?.trim() || getDefaultHandoffText();
      await replyMessage(replyToken, handoffText, undefined, creds);
      insertedAssistant = await insertConversationMessage(contact.id, handoffText, 'assistant', {
        status: 'needs_human',
        resolved_by: 'unresolved',
        is_resolved: false,
        confidence_score: decision.confidence,
        ab_test_id: abTestId,
        ab_variant: abVariant,
      });
    }

    void autoTagContact(contact.id, ownerUserId, userMessage);
    void invalidateAnalyticsCache(ownerUserId);

    await markAsProcessed(eventId, botId);

    console.info('[LINE webhook] Event processed', {
      requestId,
      eventId,
      contactId: contact.id,
      lineUserId,
      action: decision.action,
      category: decision.category,
      confidence: decision.confidence,
    });
  } catch (error) {
    console.error('[LINE webhook] Event error', {
      requestId,
      eventId: getEventId(event),
      contactId: contact?.id ?? undefined,
      lineUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    try {
      await replyMessage(
        replyToken,
        '抱歉，處理您的訊息時發生錯誤。請稍後再試。',
        undefined,
        creds
      );
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
    throw error;
  }
}

// Handle GET request (for LINE webhook verification)
export async function GET() {
  return NextResponse.json({ status: 'LINE webhook is ready' });
}