import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateSignature } from '@/lib/line';
import { decrypt, hashWebhookKey } from '@/lib/encrypt';
import { enqueueWebhookEventProcess } from '@/lib/qstash';
import type { LineWebhookBody, LineWebhookEvent } from '@/lib/line';

type RouteParams = { params: Promise<{ botId: string; webhookKey: string }> };

function getEventId(event: LineWebhookEvent): string {
  return (
    event.webhookEventId ??
    event.message?.id ??
    (event.replyToken ? `token:${event.replyToken}` : `ts:${event.timestamp}:${event.source?.userId ?? 'unknown'}`)
  );
}

/** B1: Only locate bot → verify → write one row per event → 200. No AI/workflow/reply. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = `line-bot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const { botId, webhookKey } = await params;
    if (!botId || !webhookKey) {
      return NextResponse.json({ error: 'Missing botId or webhookKey' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: bot, error: botError } = await admin
      .from('line_bots')
      .select('id, user_id, webhook_key_hash, encrypted_channel_secret, encrypted_channel_access_token, encryption_version')
      .eq('id', botId)
      .eq('is_active', true)
      .maybeSingle();

    if (botError || !bot) {
      console.warn('[LINE webhook] Bot not found or inactive', { requestId, botId });
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const keyHash = hashWebhookKey(webhookKey);
    if (keyHash !== bot.webhook_key_hash) {
      console.warn('[LINE webhook] Invalid webhook key', { requestId, botId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let channelSecret: string;
    try {
      const { decrypt: decryptEnvelope } = await import('@/lib/crypto/envelope');
      const version = Number(bot.encryption_version) || 1;
      channelSecret = decryptEnvelope(bot.encrypted_channel_secret, version);
    } catch (e) {
      try {
        const { decrypt: legacyDecrypt } = await import('@/lib/encrypt');
        channelSecret = legacyDecrypt(bot.encrypted_channel_secret);
      } catch (e2) {
        console.error('[LINE webhook] Decrypt failed', { requestId, botId, error: e2 });
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }
    }

    const body = await request.text();
    const signature = request.headers.get('x-line-signature');
    if (!validateSignature(body, signature, channelSecret)) {
      console.warn('[LINE webhook] Invalid signature', { requestId, botId });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookBody: LineWebhookBody = JSON.parse(body);
    const events = webhookBody.events ?? [];

    if (events.length === 0) {
      return NextResponse.json({ success: true });
    }

    const insertedIds: string[] = [];
    for (const event of events) {
      const eventId = getEventId(event);
      const eventType = event.type ?? 'message';
      const { data: row, error: insertErr } = await admin
        .from('webhook_events')
        .insert({
          bot_id: bot.id,
          event_id: eventId,
          event_type: eventType,
          raw_event: event as unknown as Record<string, unknown>,
          status: 'pending',
        })
        .select('id')
        .maybeSingle();

      if (insertErr) {
        if (insertErr.code === '23505') {
          continue;
        }
        console.error('[LINE webhook] Failed to persist event', { requestId, botId, eventId, error: insertErr });
        continue;
      }
      if (row?.id) insertedIds.push(row.id);
    }

    for (const id of insertedIds) {
      void enqueueWebhookEventProcess(id);
    }

    console.info('[LINE webhook] B1 events landed', { requestId, botId, count: insertedIds.length, durationMs: Date.now() - start });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE webhook] Error', {
      requestId,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'LINE webhook (multi-bot) B1 ready' });
}
