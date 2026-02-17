import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LINE_BOT_INFO_URL = 'https://api.line.me/v2/bot/info';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await request.json();
    const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : '';
    const channelSecret = typeof body.channelSecret === 'string' ? body.channelSecret.trim() : '';
    const channelAccessToken = typeof body.channelAccessToken === 'string' ? body.channelAccessToken.trim() : '';

    if (!channelId || !channelSecret || !channelAccessToken) {
      return NextResponse.json(
        { success: false, error: '請填寫 Channel ID、Channel Secret 與 Channel Access Token' },
        { status: 400 }
      );
    }

    const res = await fetch(LINE_BOT_INFO_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let message = '連線驗證失敗';
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        if (text) message = text.slice(0, 200);
      }
      return NextResponse.json({ success: false, error: message }, { status: 200 });
    }

    const data = (await res.json()) as { displayName?: string; pictureUrl?: string };
    const displayName = data.displayName ?? 'Bot';
    const pictureUrl = data.pictureUrl ?? null;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        line_channel_id: channelId.slice(0, 100),
        line_channel_secret: channelSecret.slice(0, 200),
        line_channel_access_token: channelAccessToken,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { success: false, error: '驗證成功但儲存設定失敗，請重試' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      displayName,
      pictureUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: '網路錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
