import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, LineWebhookBody, LineWebhookEvent } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { searchKnowledgeWithSources } from '@/lib/knowledge-search';
import { getOrCreateContactByLineUserId, getUserSettings, insertConversationMessage } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getConversationUsageForUser } from '@/lib/billing-usage';
import { autoTagContact } from '@/lib/auto-tag';
import { isProcessed, markAsProcessed } from '@/lib/idempotency';
import { checkRateLimit } from '@/lib/rate-limit';
import { invalidateAnalyticsCache } from '@/lib/analytics-cache';
import { detectSensitiveKeywords } from '@/lib/sensitive-keywords';
import { generateSecurePrompt } from '@/lib/secure-prompt';

const KNOWLEDGE_PREFIX = '\n\n以下是相關的知識庫資料，請優先參考這些資訊來回答：\n';
const SENSITIVE_CONTENT_REPLY = '此問題涉及敏感內容，建議聯繫人工客服。';

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleEvent(event: LineWebhookEvent, requestId: string): Promise<void> {
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return;
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId;

  if (!userMessage || !replyToken || !lineUserId) {
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

  const ownerUserId = process.env.LINE_OWNER_USER_ID;
  if (!ownerUserId) {
    console.error('LINE_OWNER_USER_ID is not set');
    try {
      await replyMessage(replyToken, '抱歉，服務設定有誤，請稍後再試。');
    } catch {
      // ignore
    }
    return;
  }

  try {
    const admin = getSupabaseAdmin();
    const { limit, used } = await getConversationUsageForUser(admin, ownerUserId);
    if (limit !== -1 && used >= limit) {
      await replyMessage(replyToken, '很抱歉，本月對話額度已用完，請聯繫商家。');
      return;
    }

    const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);

    const { system_prompt: systemPrompt, ai_model: aiModel } = await getUserSettings(ownerUserId);
    const { text: knowledgeText, sources } = await searchKnowledgeWithSources(
      ownerUserId,
      userMessage,
      3,
      2000
    );
    const baseSystemPrompt = knowledgeText
      ? (systemPrompt?.trim() ?? '') + KNOWLEDGE_PREFIX + knowledgeText
      : systemPrompt ?? '';
    const fullSystemPrompt = generateSecurePrompt({
      baseSystemPrompt,
      userMessage: userMessage,
    });
    const aiResponse = await generateReply(userMessage, fullSystemPrompt, aiModel, ownerUserId);

    await replyMessage(replyToken, aiResponse);

    await insertConversationMessage(contact.id, userMessage, 'user');
    const resolution = computeResolution(sources.length, aiResponse);
    await insertConversationMessage(contact.id, aiResponse, 'assistant', {
      status: resolution.status,
      resolved_by: resolution.resolved_by,
      is_resolved: resolution.is_resolved,
    });

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
