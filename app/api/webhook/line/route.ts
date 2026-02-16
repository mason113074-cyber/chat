import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, LineWebhookBody, LineWebhookEvent } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { getOrCreateContactByLineUserId, insertConversationMessage } from '@/lib/supabase';

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
    const contact = await getOrCreateContactByLineUserId(lineUserId, ownerUserId);

    const aiResponse = await generateReply(userMessage);

    await replyMessage(replyToken, aiResponse);

    await insertConversationMessage(contact.id, userMessage, 'user');
    await insertConversationMessage(contact.id, aiResponse, 'assistant');

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
