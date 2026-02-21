import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { encrypt, hashWebhookKey } from '@/lib/encrypt';
import crypto from 'crypto';

/**
 * GET /api/settings/bots - List current user's line_bots (via RLS).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: bots, error } = await supabase
      .from('line_bots')
      .select('id, name, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/settings/bots error:', error);
      return NextResponse.json({ error: 'Failed to list bots' }, { status: 500 });
    }
    return NextResponse.json({ bots: bots ?? [] });
  } catch (e) {
    console.error('GET /api/settings/bots error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/settings/bots - Create a line_bot (name, webhook_key optional, channel_secret, channel_access_token).
 * Returns bot id and webhook_key so client can display webhook URL.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const channelSecret = typeof body.channel_secret === 'string' ? body.channel_secret.trim() : '';
    const channelAccessToken = typeof body.channel_access_token === 'string' ? body.channel_access_token.trim() : '';
    let webhookKey = typeof body.webhook_key === 'string' ? body.webhook_key.trim() : '';

    if (!name || !channelSecret || !channelAccessToken) {
      return NextResponse.json({ error: 'name, channel_secret, channel_access_token are required' }, { status: 400 });
    }
    if (!webhookKey) {
      webhookKey = crypto.randomBytes(24).toString('hex');
    }

    const webhookKeyHash = hashWebhookKey(webhookKey);
    let encryptedSecret: string;
    let encryptedToken: string;
    try {
      encryptedSecret = encrypt(channelSecret);
      encryptedToken = encrypt(channelAccessToken);
    } catch (e) {
      console.error('POST /api/settings/bots encrypt error:', e);
      return NextResponse.json({ error: 'Encryption not configured (LINE_BOT_ENCRYPTION_KEY)' }, { status: 500 });
    }

    const admin = getSupabaseAdmin();
    const { data: bot, error } = await admin
      .from('line_bots')
      .insert({
        user_id: user.id,
        name,
        webhook_key_hash: webhookKeyHash,
        encrypted_channel_secret: encryptedSecret,
        encrypted_channel_access_token: encryptedToken,
        is_active: true,
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error('POST /api/settings/bots insert error:', error);
      return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 });
    }

    return NextResponse.json({
      bot: { id: bot.id, name: bot.name, created_at: bot.created_at },
      webhook_key: webhookKey,
      webhook_url_path: `/api/webhook/line/${bot.id}/${webhookKey}`,
    });
  } catch (e) {
    console.error('POST /api/settings/bots error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
