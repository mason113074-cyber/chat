import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lineClient, type LineCredentials } from '@/lib/line';

/**
 * POST /api/settings/bots/test - Test LINE credentials (channel_secret, channel_access_token).
 * Returns bot display name on success. Does not persist.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const channelSecret = typeof body.channel_secret === 'string' ? body.channel_secret.trim() : '';
    const channelAccessToken = typeof body.channel_access_token === 'string' ? body.channel_access_token.trim() : '';

    if (!channelSecret || !channelAccessToken) {
      return NextResponse.json(
        { error: 'channel_secret and channel_access_token are required' },
        { status: 400 }
      );
    }

    const credentials: LineCredentials = { channelSecret, channelAccessToken };
    const client = lineClient(credentials);
    const botInfo = await client.getBotInfo();

    return NextResponse.json({
      success: true,
      botInfo: {
        displayName: botInfo.displayName ?? 'LINE Bot',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid channel secret or token';
    console.error('POST /api/settings/bots/test error:', err);
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
