import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { encrypt, hashWebhookKey } from '@/lib/encrypt';
import crypto from 'crypto';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/settings/bots/[id] - Update bot (name, optional credentials, optional regenerate webhook key).
 * Body: { name?, channel_secret?, channel_access_token?, webhook_key?, regenerate_webhook_key?: boolean }
 * If regenerate_webhook_key is true, server generates new webhook_key and returns it; credentials optional.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const channelSecret = typeof body.channel_secret === 'string' ? body.channel_secret.trim() : undefined;
    const channelAccessToken = typeof body.channel_access_token === 'string' ? body.channel_access_token.trim() : undefined;
    let webhookKey = typeof body.webhook_key === 'string' ? body.webhook_key.trim() : undefined;
    const regenerateWebhookKey = body.regenerate_webhook_key === true;

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from('line_bots')
      .select('id, user_id, name, webhook_key_hash, encrypted_channel_secret, encrypted_channel_access_token')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name;

    if (regenerateWebhookKey) {
      webhookKey = crypto.randomBytes(24).toString('hex');
      updates.webhook_key_hash = hashWebhookKey(webhookKey);
    } else if (webhookKey) {
      updates.webhook_key_hash = hashWebhookKey(webhookKey);
    }

    if (channelSecret !== undefined && channelAccessToken !== undefined) {
      try {
        updates.encrypted_channel_secret = encrypt(channelSecret);
        updates.encrypted_channel_access_token = encrypt(channelAccessToken);
      } catch (e) {
        console.error('PUT /api/settings/bots/[id] encrypt error:', e);
        return NextResponse.json({ error: 'Encryption not configured (LINE_BOT_ENCRYPTION_KEY)' }, { status: 500 });
      }
    }

    const { data: updated, error } = await admin
      .from('line_bots')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, is_active, created_at')
      .single();

    if (error) {
      console.error('PUT /api/settings/bots/[id] error:', error);
      return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 });
    }

    const res: { bot?: typeof updated; webhook_key?: string; webhook_url_path?: string } = { bot: updated };
    if (webhookKey) {
      res.webhook_key = webhookKey;
      res.webhook_url_path = `/api/webhook/line/${id}/${webhookKey}`;
    }
    return NextResponse.json(res);
  } catch (e) {
    console.error('PUT /api/settings/bots/[id] error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/bots/[id] - Delete bot (RLS: user must own).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('line_bots')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('DELETE /api/settings/bots/[id] error:', error);
      return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/settings/bots/[id] error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
