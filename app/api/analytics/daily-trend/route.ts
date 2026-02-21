import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

type TrendPoint = {
  date: string;
  aiResolved: number;
  humanRequired: number;
  totalConversations: number;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }

    const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 7));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const map = new Map<string, TrendPoint>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = toKey(d);
      map.set(key, { date: key, aiResolved: 0, humanRequired: 0, totalConversations: 0 });
    }

    if (contactIds.length > 0) {
      const { data: rows } = await supabase
        .from('conversations')
        .select('created_at, status, is_resolved, resolved_by')
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      for (const row of rows ?? []) {
        const key = toKey(new Date(row.created_at));
        const point = map.get(key);
        if (!point) continue;
        point.totalConversations += 1;

        const needsHuman =
          row.status === 'needs_human' ||
          row.is_resolved === false ||
          row.resolved_by === 'human';
        if (needsHuman) point.humanRequired += 1;
        else point.aiResolved += 1;
      }
    }

    return NextResponse.json({ series: Array.from(map.values()) });
  } catch (e) {
    console.error('GET /api/analytics/daily-trend error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

