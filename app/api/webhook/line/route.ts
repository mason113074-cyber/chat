import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, replyMessage, LineWebhookBody, LineWebhookEvent } from '@/lib/line';
import { generateReply } from '@/lib/openai';
import { saveConversation } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature validation
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // Validate LINE signature
    if (!validateSignature(body, signature)) {
      console.error('Invalid LINE signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook body
    const webhookBody: LineWebhookBody = JSON.parse(body);
    const events = webhookBody.events;

    // Process each event
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
  // Only handle message events with text
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return;
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const userId = event.source.userId || 'unknown';

  if (!userMessage || !replyToken) {
    return;
  }

  try {
    // Generate AI reply using OpenAI
    const aiResponse = await generateReply(userMessage);

    // Reply to the user via LINE
    await replyMessage(replyToken, aiResponse);

    // Save conversation to Supabase
    await saveConversation({
      user_id: userId,
      user_message: userMessage,
      ai_response: aiResponse,
      platform: 'line',
    });

    console.log('Successfully processed message:', {
      userId,
      userMessage,
      aiResponse: aiResponse.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('Error handling event:', error);

    // Try to send an error message to the user
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
