import * as line from '@line/bot-sdk';
import crypto from 'crypto';

// Lazy initialization to avoid build-time errors
let lineClientInstance: line.messagingApi.MessagingApiClient | null = null;

function getLineClient(): line.messagingApi.MessagingApiClient {
  if (!lineClientInstance) {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN environment variable is not set');
    }
    lineClientInstance = new line.messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });
  }
  return lineClientInstance;
}

export { getLineClient as lineClient };

// Validate LINE signature
export function validateSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    throw new Error('LINE_CHANNEL_SECRET environment variable is not set');
  }

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}

// Reply message to user
export async function replyMessage(
  replyToken: string,
  text: string,
  quickReplyItems?: { label: string; text: string }[]
): Promise<void> {
  try {
    const client = getLineClient();
    const message: line.messagingApi.TextMessage = {
      type: 'text',
      text,
    };

    if (quickReplyItems && quickReplyItems.length > 0) {
      message.quickReply = {
        items: quickReplyItems.slice(0, 13).map((item) => ({
          type: 'action' as const,
          action: {
            type: 'message' as const,
            label: item.label.substring(0, 20),
            text: item.text,
          },
        })),
      };
    }

    await client.replyMessage({
      replyToken,
      messages: [message],
    });
  } catch (error) {
    console.error('Error replying to LINE message:', error);
    throw error;
  }
}

/** Sprint 8: Push message (used after replyToken consumed, e.g. feedback template) */
export async function pushMessage(
  userId: string,
  message: line.messagingApi.Message
): Promise<void> {
  const client = getLineClient();
  await client.pushMessage({ to: userId, messages: [message] });
}

// LINE webhook event types (see https://developers.line.biz/en/docs/messaging-api/receiving-messages)
export interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  webhookEventId?: string;
  deliveryContext?: { isRedelivery?: boolean };
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  postback?: { data: string };
  timestamp: number;
}

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}
