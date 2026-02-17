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
    start.setHours(0, 0, 0, 0);

    const { data: contactRows } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    const dateToKey = (d: Date) => d.toISOString().slice(0, 10);
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      map[dateToKey(d)] = 0;
    }

    if (contactIds.length > 0) {
      const { data: rows } = await supabase
        .from('conversations')
        .select('created_at')
        .in('contact_id', contactIds)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      for (const r of rows ?? []) {
        const k = dateToKey(new Date(r.created_at!));
        if (k in map) map[k]++;
      }
    }

    const series = Object.keys(map)
      .sort()
      .map((date) => ({ date, count: map[date] }));

    return NextResponse.json({ series });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
