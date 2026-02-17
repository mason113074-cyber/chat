import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const { data: contactRows } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    const hourly: number[] = Array.from({ length: 24 }, () => 0);

    if (contactIds.length > 0) {
      const { data: rows } = await supabase
        .from('conversations')
        .select('created_at')
        .in('contact_id', contactIds)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      for (const r of rows ?? []) {
        const h = new Date(r.created_at!).getHours();
        hourly[h]++;
      }
    }

    const series = hourly.map((count, hour) => ({ hour, count }));

    return NextResponse.json({ series });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
