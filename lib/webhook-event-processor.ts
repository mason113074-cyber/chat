/**
 * B1: Process one webhook_events row (after lock).
 * Uses pushMessage only (no replyToken). Decision: high risk → SUGGEST + ack; else AUTO/ASK/HANDOFF.
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { pushMessage } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { searchKnowledgeWithSources } from '@/lib/knowledge-search';
import { getOrCreateContactByLineUserId, getUserSettings, insertConversationMessage, getRecentConversationMessages } from '@/lib/supabase';
import { getConversationUsageForUser } from '@/lib/billing-usage';
import { detectSensitiveKeywords, HIGH_RISK_KEYWORDS, isRefundOrMoneyRequest, isStructuredRefundOrReturnRequest } from '@/lib/security/sensitive-keywords';
import { calculateConfidence } from '@/lib/confidence';
import { invalidateAnalyticsCache } from '@/lib/analytics-cache';
import type { LineWebhookEvent } from '@/lib/line';

function getEventId(event: LineWebhookEvent): string {
  return (
    event.webhookEventId ??
    event.message?.id ??
    (event.replyToken ? `token:${event.replyToken}` : `ts:${event.timestamp}:${event.source?.userId ?? 'unknown'}`)
  );
}

const KNOWLEDGE_PREFIX = '\n\n## 以下是你可以參考的知識庫內容（只能根據以下內容回答，勿使用其他知識）：\n';
const KNOWLEDGE_EMPTY_INSTRUCTION = '\n\n注意：知識庫中沒有找到與此問題相關的內容，請回覆需要轉接專人，勿自行編造答案。';
const HIGH_RISK_ACK = '已收到，我們將由專員協助處理。';
const HANDOFF_MSG = '這個問題需要專人為您處理，請稍候。';
const REFUND_SAFE_DRAFT = '已收到您的退款申請，我們將由專員確認後盡快為您處理，請稍候。';
const REFUND_ASK_TEXT = '為協助您辦理退款，請提供訂單編號，方便我們查核訂單狀態。';
const FORBIDDEN_PATTERNS = [/免費送你/, /我可以給你.*折/, /退.*全額/, /保證.*效果/, /我不是AI/, /我是真人/];
const MAX_REPLY_LENGTH = 500;

export interface ProcessContext {
  webhookEventId: string;
  botId: string;
  ownerUserId: string;
  channelAccessToken: string;
  rawEvent: LineWebhookEvent;
}

export async function processOneWebhookEvent(ctx: ProcessContext): Promise<{ ok: boolean; error?: string }> {
  const { webhookEventId, botId, ownerUserId, channelAccessToken, rawEvent } = ctx;
  const creds = { channelSecret: '', channelAccessToken };
  const lineUserId = rawEvent.source?.userId;
  const eventType = rawEvent.type;

  if (!lineUserId) {
    return { ok: true };
  }

  if (eventType === 'follow') {
    const settings = await getUserSettings(ownerUserId);
    if (settings?.welcome_message_enabled && settings?.welcome_message) {
      await pushMessage(lineUserId, { type: 'text', text: settings.welcome_message }, creds);
    }
    return { ok: true };
  }

  if (eventType !== 'message' || rawEvent.message?.type !== 'text') {
    return { ok: true };
  }

  const userMessage = rawEvent.message.text ?? '';
  if (!userMessage) return { ok: true };

  const admin = getSupabaseAdmin();
  const { limit, used } = await getConversationUsageForUser(admin, ownerUserId);
  if (limit !== -1 && used >= limit) {
    await pushMessage(lineUserId, { type: 'text', text: '很抱歉，本月對話額度已用完，請聯繫商家。' }, creds);
    return { ok: true };
  }

  const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId, undefined, botId);
  const settings = await getUserSettings(ownerUserId);
  const confidenceThreshold = settings?.confidence_threshold ?? 0.6;

  const sensitiveCheck = detectSensitiveKeywords(userMessage);
  const isHighRisk = sensitiveCheck.riskLevel === 'high' || HIGH_RISK_KEYWORDS.some((k) =>
    userMessage.toLowerCase().includes(k.toLowerCase())
  );

  const lineEventId = getEventId(rawEvent);

  if (isHighRisk) {
    // 退款/退錢：改走 SUGGEST/ASK，不再 hard-stop
    if (isRefundOrMoneyRequest(userMessage)) {
      const hasOrderContext = isStructuredRefundOrReturnRequest(userMessage);
      const suggestedReply = hasOrderContext ? REFUND_SAFE_DRAFT : REFUND_ASK_TEXT;
      const category = hasOrderContext ? 'refund_suggest' : 'refund_ask';
      await insertConversationMessage(contact.id, userMessage, 'user');
      await admin.from('ai_suggestions').insert({
        contact_id: contact.id,
        user_id: ownerUserId,
        bot_id: botId,
        event_id: lineEventId,
        user_message: userMessage,
        suggested_reply: suggestedReply,
        sources_count: 0,
        confidence_score: 0,
        risk_category: 'high',
        category,
        sources: [],
        status: 'draft',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      await pushMessage(lineUserId, { type: 'text', text: hasOrderContext ? HIGH_RISK_ACK : REFUND_ASK_TEXT }, creds);
      void invalidateAnalyticsCache(ownerUserId);
      return { ok: true };
    }

    await insertConversationMessage(contact.id, userMessage, 'user');
    await admin.from('ai_suggestions').insert({
      contact_id: contact.id,
      user_id: ownerUserId,
      bot_id: botId,
      event_id: lineEventId,
      user_message: userMessage,
      suggested_reply: HIGH_RISK_ACK,
      sources_count: 0,
      confidence_score: 0,
      risk_category: 'high',
      category: 'high_risk',
      sources: [],
      status: 'draft',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    await pushMessage(lineUserId, { type: 'text', text: HIGH_RISK_ACK }, creds);
    void invalidateAnalyticsCache(ownerUserId);
    return { ok: true };
  }

  const { text: knowledgeText, sources } = await searchKnowledgeWithSources(ownerUserId, userMessage, 3, 2000);
  const systemPrompt = (settings?.system_prompt ?? '') + (knowledgeText ? KNOWLEDGE_PREFIX + knowledgeText : KNOWLEDGE_EMPTY_INSTRUCTION);
  const recentMessages = await getRecentConversationMessages(contact.id, settings?.conversation_memory_count ?? 5);
  const aiResponse = await generateReply(
    userMessage,
    systemPrompt,
    settings?.ai_model ?? null,
    ownerUserId,
    contact.id,
    recentMessages,
    { maxReplyLength: settings?.max_reply_length ?? 500 }
  );

  let finalReply = aiResponse;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(aiResponse)) {
      finalReply = '感謝您的詢問！此問題需要專員處理，我已為您記錄，會盡快回覆您。';
      break;
    }
  }
  if (finalReply.length > MAX_REPLY_LENGTH) {
    finalReply = finalReply.substring(0, MAX_REPLY_LENGTH - 3) + '...';
  }

  const confidence = calculateConfidence({
    knowledgeSourceCount: sources.length,
    aiReply: finalReply,
    guardrailTriggered: finalReply !== aiResponse,
  });

  if (sources.length === 0 || confidence.score < confidenceThreshold) {
    await insertConversationMessage(contact.id, userMessage, 'user');
    await admin.from('ai_suggestions').insert({
      contact_id: contact.id,
      user_id: ownerUserId,
      bot_id: botId,
      event_id: lineEventId,
      user_message: userMessage,
      suggested_reply: finalReply,
      sources_count: sources.length,
      confidence_score: confidence.score,
      risk_category: sensitiveCheck.riskLevel,
      category: 'low_confidence',
      sources: sources as unknown as Record<string, unknown>[],
      status: 'draft',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    await pushMessage(lineUserId, { type: 'text', text: HANDOFF_MSG }, creds);
    void invalidateAnalyticsCache(ownerUserId);
    return { ok: true };
  }

  await insertConversationMessage(contact.id, userMessage, 'user');
  await pushMessage(lineUserId, { type: 'text', text: finalReply }, creds);
  await insertConversationMessage(contact.id, finalReply, 'assistant', {
    status: 'ai_handled',
    resolved_by: 'ai',
    is_resolved: true,
    confidence_score: confidence.score,
  });
  void invalidateAnalyticsCache(ownerUserId);
  return { ok: true };
}
