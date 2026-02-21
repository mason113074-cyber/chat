import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, pushMessage, LineWebhookBody, LineWebhookEvent } from '@/lib/line';
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
import { calculateConfidence } from '@/lib/confidence';
import { isWithinBusinessHours } from '@/lib/business-hours';
import { summarizeConversation } from '@/lib/conversation-summary';

const KNOWLEDGE_PREFIX =
  '\n\n## 以下是你可以參考的知識庫內容（只能根據以下內容回答，勿使用其他知識）：\n';
const KNOWLEDGE_EMPTY_INSTRUCTION =
  '\n\n注意：知識庫中沒有找到與此問題相關的內容，請回覆需要轉接專人，勿自行編造答案。';
const SENSITIVE_CONTENT_REPLY = '此問題涉及敏感內容，建議聯繫人工客服。';
const GUARDRAIL_SAFE_REPLY = '感謝您的詢問！此問題需要專員處理，我已為您記錄，會盡快回覆您。';

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

    for (const event of events) {
      await handleEvent(event, requestId);
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
    // Return 200 so LINE does not retry (avoid duplicate processing)
    return NextResponse.json({ success: true });
  }
}

const REPLY_IMAGE_UNSUPPORTED = '目前不支援圖片，請用文字描述您的問題。';
const REPLY_STICKER = '感謝您傳送貼圖 😊';
const REPLY_LOCATION_RECEIVED = '已收到您的位置資訊，感謝。';

async function handleEvent(event: LineWebhookEvent, requestId: string): Promise<void> {
  const replyToken = event.replyToken;
  const lineUserId = event.source?.userId;
  const ownerUserId = process.env.LINE_OWNER_USER_ID;

  // Sprint 10: follow event - welcome message
  if (event.type === 'follow' && lineUserId && ownerUserId && replyToken) {
    try {
      const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);
      const settings = await getUserSettings(ownerUserId);
      if (settings.welcome_message_enabled && settings.welcome_message) {
        await replyMessage(replyToken, settings.welcome_message);
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
          await replyMessage(replyToken, rating === 'positive' ? '感謝您的回饋！😊' : '感謝您的回饋，我們會持續改進！');
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

  // Non-text message types: reply once and mark processed
  if (msgType === 'image') {
    try {
      await replyMessage(replyToken, REPLY_IMAGE_UNSUPPORTED);
    } catch (e) {
      console.error('[LINE webhook] Failed to send image-unsupported reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(getEventId(event));
    } catch {
      // ignore
    }
    return;
  }

  if (msgType === 'sticker') {
    try {
      await replyMessage(replyToken, REPLY_STICKER);
    } catch (e) {
      console.error('[LINE webhook] Failed to send sticker reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(getEventId(event));
    } catch {
      // ignore
    }
    return;
  }

  if (msgType === 'location') {
    try {
      await replyMessage(replyToken, REPLY_LOCATION_RECEIVED);
    } catch (e) {
      console.error('[LINE webhook] Failed to send location reply', { requestId, error: e });
    }
    try {
      await markAsProcessed(getEventId(event));
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

  const eventId = getEventId(event);
  if (await isProcessed(eventId)) {
    console.info('[LINE webhook] Duplicate event skipped', { requestId, eventId });
    return;
  }

  const { allowed: rateLimitOk, remaining, resetAt } = await checkRateLimit(lineUserId);
  if (!rateLimitOk) {
    console.warn('[LINE webhook] Rate limit exceeded', { requestId, lineUserId, remaining, resetAt: resetAt.toISOString() });
    try {
      await replyMessage(replyToken, '您發送訊息的頻率過高，請稍後再試。');
    } catch {
      // ignore
    }
    return;
  }

  const sensitiveCheck = detectSensitiveKeywords(userMessage);
  if (sensitiveCheck.riskLevel !== 'low') {
    console.info('[LINE webhook] Sensitive message blocked', {
      requestId,
      eventId,
      riskLevel: sensitiveCheck.riskLevel,
      keywords: sensitiveCheck.keywords.slice(0, 5),
    });

    try {
      await replyMessage(replyToken, SENSITIVE_CONTENT_REPLY);
    } catch (replyError) {
      console.error('[LINE webhook] Failed to send sensitive-content reply', {
        requestId,
        eventId,
        error: replyError instanceof Error ? replyError.message : String(replyError),
      });
    }

    try {
      await markAsProcessed(eventId);
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
      await replyMessage(replyToken, '抱歉，服務設定有誤，請稍後再試。');
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
      await replyMessage(replyToken, '很抱歉，本月對話額度已用完，請聯繫商家。');
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
    } = settings;

    // Sprint 2: 自訂敏感詞檢查（在內建敏感詞之後）
    const customMatch = customSensitiveWords?.some((word: string) =>
      userMessage.toLowerCase().includes(String(word).toLowerCase())
    );
    if (customMatch) {
      await replyMessage(replyToken, sensitiveWordReply || SENSITIVE_CONTENT_REPLY);
      await markAsProcessed(eventId);
      return;
    }

    // Sprint 7: 營業時間
    const {
      business_hours_enabled: businessHoursEnabled,
      business_hours: businessHours,
      outside_hours_mode: outsideHoursMode,
      outside_hours_message: outsideHoursMessage,
      confidence_threshold: confidenceThreshold = 0.6,
      low_confidence_action: lowConfidenceAction,
      handoff_message: handoffMessage,
      feedback_enabled: feedbackEnabled,
      feedback_message: feedbackMessage,
      conversation_memory_count: memoryCount = 5,
      conversation_memory_mode: memoryMode,
    } = settings;

    if (businessHoursEnabled && !isWithinBusinessHours(businessHours)) {
      if (outsideHoursMode === 'auto_reply') {
        await replyMessage(replyToken, outsideHoursMessage || '感謝您的訊息！目前為非營業時間，我們將在營業時間盡快回覆您。');
        await markAsProcessed(eventId);
        return;
      }
      if (outsideHoursMode === 'collect_info') {
        await replyMessage(replyToken, (outsideHoursMessage || '') + '\n\n請留下您的問題，我們會在營業時間回覆您：');
        await insertConversationMessage(contact.id, userMessage, 'user');
        await markAsProcessed(eventId);
        return;
      }
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
      effectiveSystemPrompt = variant === 'A' ? runningTest.variant_a_prompt : runningTest.variant_b_prompt;
      abTestId = runningTest.id;
      abVariant = variant;
    }

    const basePrompt = knowledgeText
      ? effectiveSystemPrompt + KNOWLEDGE_PREFIX + knowledgeText
      : effectiveSystemPrompt + KNOWLEDGE_EMPTY_INSTRUCTION;

    // Sprint 5: Guidance rules
    const { data: guidanceRules } = await admin
      .from('ai_guidance_rules')
      .select('rule_title, rule_content')
      .eq('user_id', ownerUserId)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });
    const guidance = (guidanceRules ?? []).map((r) => ({ rule_title: r.rule_title, rule_content: r.rule_content }));

    // Sprint 9: Conversation memory
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

    let finalReply = aiResponse;
    let guardrailTriggered = false;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(aiResponse)) {
        finalReply = GUARDRAIL_SAFE_REPLY;
        guardrailTriggered = true;
        break;
      }
    }
    if (finalReply.length > MAX_REPLY_LENGTH) {
      finalReply = finalReply.substring(0, MAX_REPLY_LENGTH - 3) + '...';
    }

    // Sprint 6: 信心分數 + 低信心動作
    const confidence = calculateConfidence({
      knowledgeSourceCount: sources.length,
      aiReply: finalReply,
      guardrailTriggered,
    });
    const threshold = confidenceThreshold ?? 0.6;
    if (confidence.score < threshold) {
      const action = lowConfidenceAction ?? 'handoff';
      if (action === 'handoff') {
        finalReply = handoffMessage || '這個問題需要專人為您處理，請稍候。';
      } else if (action === 'append_disclaimer') {
        finalReply += '\n\n（以上回覆供參考，如需進一步協助請輸入「轉人工」）';
      }
    }

    // Sprint 3: 回覆延遲（模擬真人打字）
    const delayMs = (replyDelaySeconds ?? 0) * 1000;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await replyMessage(replyToken, finalReply);

    await insertConversationMessage(contact.id, userMessage, 'user');
    const needsHumanFromUser = HUMAN_HANDOFF_KEYWORDS.some((keyword) =>
      userMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    const needsHumanFromAi = AI_HANDOFF_PHRASES.some((phrase) => finalReply.includes(phrase));
    const needsHuman =
      guardrailTriggered || needsHumanFromUser || needsHumanFromAi;
    const resolution = needsHuman
      ? { status: 'needs_human' as const, resolved_by: 'unresolved', is_resolved: false }
      : computeResolution(sources.length, finalReply);
    const inserted = await insertConversationMessage(contact.id, finalReply, 'assistant', {
      status: resolution.status,
      resolved_by: resolution.resolved_by,
      is_resolved: resolution.is_resolved,
      confidence_score: confidence.score,
      ab_test_id: abTestId,
      ab_variant: abVariant,
    });

    // Sprint 8: 滿意度回饋 push
    if (feedbackEnabled && inserted?.id && lineUserId) {
      try {
        const feedbackText = feedbackMessage || '這個回覆有幫助嗎？';
        await pushMessage(lineUserId, {
          type: 'template',
          altText: feedbackText,
          template: {
            type: 'confirm',
            text: feedbackText,
            actions: [
              { type: 'postback', label: '👍 有幫助', data: `feedback:positive:${inserted.id}` },
              { type: 'postback', label: '👎 沒幫助', data: `feedback:negative:${inserted.id}` },
            ],
          },
        });
      } catch (e) {
        console.warn('[LINE webhook] Feedback push failed', { requestId, error: e });
      }
    }

    void autoTagContact(contact.id, ownerUserId, userMessage);
    void invalidateAnalyticsCache(ownerUserId);

    await markAsProcessed(eventId);

    console.info('[LINE webhook] Event processed', {
      requestId,
      eventId,
      contactId: contact.id,
      lineUserId,
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
        '抱歉，處理您的訊息時發生錯誤。請稍後再試。'
      );
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
}

// Handle GET request (for LINE webhook verification)
export async function GET() {
  return NextResponse.json({ status: 'LINE webhook is ready' });
}
