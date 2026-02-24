import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateSignature } from '@/lib/line';
import { decrypt, hashWebhookKey } from '@/lib/encrypt';
import { handleEvent } from '../../route';
import type { LineWebhookBody } from '@/lib/line';

type RouteParams = { params: Promise<{ botId: string; webhookKey: string }> };

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
      .select('id, user_id, webhook_key_hash, encrypted_channel_secret, encrypted_channel_access_token')
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
    let channelAccessToken: string;
    try {
      channelSecret = decrypt(bot.encrypted_channel_secret);
      channelAccessToken = decrypt(bot.encrypted_channel_access_token);
    } catch (e) {
      console.error('[LINE webhook] Decrypt failed', { requestId, botId, error: e });
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-line-signature');
    if (!validateSignature(body, signature, channelSecret)) {
      console.warn('[LINE webhook] Invalid signature', { requestId, botId });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { data: webhookRow, error: insertErr } = await admin
      .from('webhook_events')
      .insert({
        bot_id: bot.id,
        raw_body: body,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[LINE webhook] Failed to persist event', { requestId, botId, error: insertErr });
      return NextResponse.json({ error: 'Failed to persist' }, { status: 500 });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const redisOk = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    if (isProd && !redisOk) {
      await admin
        .from('webhook_events')
        .update({
          status: 'failed',
          error_message: 'Upstash Redis is required in production for webhook idempotency/rate-limit',
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRow.id);
      return NextResponse.json({ success: true });
    }

    const webhookBody: LineWebhookBody = JSON.parse(body);
    const events = webhookBody.events ?? [];

    if (events.length === 0) {
      await admin.from('webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', webhookRow.id);
      return NextResponse.json({ success: true });
    }

    const credentials = { channelSecret, channelAccessToken };
    const overrides = {
      ownerUserId: bot.user_id,
      credentials,
      botId: bot.id,
    };

    for (const event of events) {
      try {
        await handleEvent(event, requestId, overrides);
      } catch (err) {
        console.error('[LINE webhook] Event error', { requestId, botId, error: err });
        await admin
          .from('webhook_events')
          .update({ status: 'failed', error_message: err instanceof Error ? err.message : String(err), processed_at: new Date().toISOString() })
          .eq('id', webhookRow.id);
        return NextResponse.json({ success: true });
      }
    }

    await admin
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', webhookRow.id);

    console.info('[LINE webhook] Success', { requestId, botId, durationMs: Date.now() - start });
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
  return NextResponse.json({ status: 'LINE webhook (multi-bot) is ready' });
}
