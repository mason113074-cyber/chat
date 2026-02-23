import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/encrypt';
import { lineClient, type LineCredentials } from '@/lib/line';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/settings/bots/[id]/test - Test existing bot's stored credentials.
 * Uses decrypted channel_secret and channel_access_token to call getBotInfo.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: bot, error: fetchError } = await admin
      .from('line_bots')
      .select('id, user_id, encrypted_channel_secret, encrypted_channel_access_token')
      .eq('id', id)
      .single();

    if (fetchError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    let channelSecret: string;
    let channelAccessToken: string;
    try {
      channelSecret = decrypt(bot.encrypted_channel_secret);
      channelAccessToken = decrypt(bot.encrypted_channel_access_token);
    } catch (e) {
      console.error('POST /api/settings/bots/[id]/test decrypt error:', e);
      return NextResponse.json(
        { error: '無法解密 Bot 憑證，請檢查 LINE_BOT_ENCRYPTION_KEY' },
        { status: 500 }
      );
    }

    const credentials: LineCredentials = { channelSecret, channelAccessToken };
    const client = lineClient(credentials);
    const botInfo = await client.getBotInfo();

    return NextResponse.json({
      success: true,
      botInfo: { displayName: botInfo.displayName ?? 'LINE Bot' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '連線失敗';
    console.error('POST /api/settings/bots/[id]/test error:', err);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
