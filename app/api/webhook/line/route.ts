import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, LineWebhookBody, LineWebhookEvent } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { searchKnowledgeWithSources } from '@/lib/knowledge-search';
import { getOrCreateContactByLineUserId, getUserSettings, insertConversationMessage } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getConversationUsageForUser } from '@/lib/billing-usage';
import { autoTagContact } from '@/lib/auto-tag';

const KNOWLEDGE_PREFIX = '\n\n以下是相關的知識庫資料，請優先參考這些資訊來回答：\n';

const NEEDS_HUMAN_KEYWORDS = /不確定|無法回答|請聯繫|請聯絡|抱歉我不清楚|抱歉我無法|轉人工|真人客服/;

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
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!validateSignature(body, signature)) {
      console.error('Invalid LINE signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookBody: LineWebhookBody = JSON.parse(body);
    const events = webhookBody.events;

    for (const event of events) {
      await handleEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleEvent(event: LineWebhookEvent): Promise<void> {
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return;
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId;

  if (!userMessage || !replyToken || !lineUserId) {
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
    const fullSystemPrompt = knowledgeText
      ? (systemPrompt?.trim() ?? '') + KNOWLEDGE_PREFIX + knowledgeText
      : systemPrompt;
    const aiResponse = await generateReply(userMessage, fullSystemPrompt, aiModel);

    await replyMessage(replyToken, aiResponse);

    await insertConversationMessage(contact.id, userMessage, 'user');
    const resolution = computeResolution(sources.length, aiResponse);
    await insertConversationMessage(contact.id, aiResponse, 'assistant', {
      status: resolution.status,
      resolved_by: resolution.resolved_by,
      is_resolved: resolution.is_resolved,
    });

    void autoTagContact(contact.id, ownerUserId, userMessage);

    console.log('Successfully processed message:', {
      contactId: contact.id,
      lineUserId,
      aiResponse: aiResponse.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('Error handling event:', error);
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
