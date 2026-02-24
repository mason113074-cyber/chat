/**
 * B1: QStash enqueue for webhook event processing.
 * When QSTASH_TOKEN and APP_URL are set, enqueues HTTP POST to process endpoint.
 * Otherwise no-op (rely on drain cron).
 */

const QSTASH_URL = 'https://qstash.upstash.io/v2/publish';

export interface EnqueueProcessPayload {
  webhook_event_id: string;
}

/**
 * Enqueue a webhook event for background processing. No-op if QStash not configured.
 */
export async function enqueueWebhookEventProcess(webhookEventId: string): Promise<boolean> {
  const token = process.env.QSTASH_TOKEN;
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!token || !baseUrl) return false;

  const destination = `${baseUrl.replace(/\/$/, '')}/api/internal/webhook-events/process`;
  const body: EnqueueProcessPayload = { webhook_event_id: webhookEventId };

  try {
    const res = await fetch(`${QSTASH_URL}/${encodeURIComponent(destination)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Upstash-Method': 'POST',
        'Upstash-Retries': '3',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[QStash] Enqueue failed', { status: res.status, webhookEventId });
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[QStash] Enqueue error', { webhookEventId, error: e });
    return false;
  }
}
