import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, line_user_id')
      .eq('user_id', user.id);
    const contactIds = (contacts ?? []).map((c) => c.id);
    if (contactIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: convRows } = await supabase
      .from('conversations')
      .select('contact_id, created_at')
      .in('contact_id', contactIds)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const countByContact: Record<string, number> = {};
    const lastByContact: Record<string, string> = {};
    for (const id of contactIds) {
      countByContact[id] = 0;
    }
    for (const r of convRows ?? []) {
      countByContact[r.contact_id] = (countByContact[r.contact_id] ?? 0) + 1;
      const t = r.created_at ?? '';
      if (!lastByContact[r.contact_id] || t > lastByContact[r.contact_id]) lastByContact[r.contact_id] = t;
    }

    const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]));
    const items = contactIds
      .map((id) => ({
        contactId: id,
        name: contactMap.get(id)?.name ?? null,
        lineUserId: contactMap.get(id)?.line_user_id ?? '',
        count: countByContact[id] ?? 0,
        lastAt: lastByContact[id] ?? null,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
