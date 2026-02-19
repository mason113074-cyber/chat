import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('users')
    .select('line_channel_access_token')
    .eq('id', user.id)
    .maybeSingle();

  if (!data?.line_channel_access_token) {
    return NextResponse.json({ error: 'No access token configured' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${data.line_channel_access_token}` },
    });

    if (res.ok) {
      const botInfo = (await res.json()) as { displayName?: string };
      return NextResponse.json({ success: true, botName: botInfo.displayName });
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
