import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { processOneWebhookEvent } from '@/lib/webhook-event-processor';
import { decrypt as decryptEnvelope } from '@/lib/crypto/envelope';
import { decrypt as legacyDecrypt } from '@/lib/encrypt';

/** B1: Process one webhook event (called by QStash or drain). Body: { webhook_event_id }. */
export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_QUEUE_SECRET;
  const authHeader = request.headers.get('authorization');
  const hasAuth = secret && authHeader === `Bearer ${secret}`;
  const hasQStash = request.headers.get('upstash-signature');
  if (!hasAuth && !hasQStash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { webhook_event_id?: string; bot_id?: string; event_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const webhookEventId = body.webhook_event_id;
  if (!webhookEventId) {
    return NextResponse.json({ error: 'webhook_event_id required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: eventRow } = await admin
    .from('webhook_events')
    .update({ status: 'processing' })
    .eq('id', webhookEventId)
    .eq('status', 'pending')
    .select('id, bot_id, raw_event, status')
    .maybeSingle();

  if (!eventRow) {
    return NextResponse.json({ success: true });
  }

  const { data: bot } = await admin
    .from('line_bots')
    .select('id, user_id, encrypted_channel_access_token, encryption_version')
    .eq('id', eventRow.bot_id)
    .maybeSingle();

  if (!bot) {
    await admin.from('webhook_events').update({ status: 'failed', last_error: 'Bot not found', processed_at: new Date().toISOString() }).eq('id', webhookEventId);
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  let channelAccessToken: string;
  try {
    const version = Number(bot.encryption_version) || 1;
    channelAccessToken = decryptEnvelope(bot.encrypted_channel_access_token, version);
  } catch {
    try {
      channelAccessToken = legacyDecrypt(bot.encrypted_channel_access_token);
    } catch (e) {
      await admin.from('webhook_events').update({ status: 'failed', last_error: 'Decrypt failed', processed_at: new Date().toISOString() }).eq('id', webhookEventId);
      return NextResponse.json({ error: 'Decrypt failed' }, { status: 500 });
    }
  }

  const rawEvent = eventRow.raw_event as Parameters<typeof processOneWebhookEvent>[0]['rawEvent'];
  const result = await processOneWebhookEvent({
    webhookEventId: eventRow.id,
    botId: bot.id,
    ownerUserId: bot.user_id,
    channelAccessToken,
    rawEvent,
  });

  if (result.ok) {
    await admin.from('webhook_events').update({ status: 'done', processed_at: new Date().toISOString() }).eq('id', webhookEventId);
  } else {
    await admin.from('webhook_events').update({ status: 'failed', last_error: result.error ?? 'Unknown', processed_at: new Date().toISOString() }).eq('id', webhookEventId);
  }

  return NextResponse.json({ success: true });
}
