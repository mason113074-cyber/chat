import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function tokenize(text: string): string[] {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const tokens = normalized.split(/[\s，。！？、；：""''（）\n\r,.;:!?]+/).filter((t) => t.length >= 2);
  return tokens;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 10));
    const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const { data: contactRows } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);
    if (contactIds.length === 0) return NextResponse.json({ items: [], total: 0 });

    const { data: rows } = await supabase
      .from('conversations')
      .select('message')
      .in('contact_id', contactIds)
      .eq('role', 'user')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const freq: Record<string, number> = {};
    let total = 0;
    for (const r of rows ?? []) {
      const msg = (r.message ?? '').trim();
      if (msg.length < 2) continue;
      const tokens = tokenize(msg);
      if (tokens.length === 0) {
        const key = msg.slice(0, 50);
        freq[key] = (freq[key] ?? 0) + 1;
        total++;
      } else {
        for (const t of tokens) {
          freq[t] = (freq[t] ?? 0) + 1;
          total++;
        }
      }
    }

    const items = Object.entries(freq)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((x) => ({ ...x, percentage: total > 0 ? Math.round((x.count / total) * 1000) / 10 : 0 }));

    return NextResponse.json({ items, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
