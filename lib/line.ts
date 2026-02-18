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
  text: string
): Promise<void> {
  try {
    const client = getLineClient();
    await client.replyMessage({
      replyToken,
      messages: [
        {
          type: 'text',
          text,
        },
      ],
    });
  } catch (error) {
    console.error('Error replying to LINE message:', error);
    throw error;
  }
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
  timestamp: number;
}

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}
