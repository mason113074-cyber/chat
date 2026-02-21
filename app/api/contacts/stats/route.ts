import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, created_at')
      .eq('user_id', user.id);

    let segmentCount = 0;
    try {
      const { data: segmentRows } = await supabase
        .from('customer_segments')
        .select('id')
        .eq('user_id', user.id);
      segmentCount = segmentRows?.length ?? 0;
    } catch {
      // Table may not exist yet (migration not applied)
    }

    const contactIds = (contacts ?? []).map((c) => c.id);
    const now = Date.now();

    let activeCount = 0;
    let weeklyNewCount = 0;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    if (contactIds.length > 0) {
      const { data: convs } = await supabase
        .from('conversations')
        .select('contact_id, created_at')
        .in('contact_id', contactIds);

      const lastMsgByContact = new Map<string, number>();
      for (const c of convs ?? []) {
        const ts = new Date(c.created_at).getTime();
        const prev = lastMsgByContact.get(c.contact_id) ?? 0;
        if (ts > prev) lastMsgByContact.set(c.contact_id, ts);
      }

      for (const c of contacts ?? []) {
        const lastMsg = lastMsgByContact.get(c.id);
        if (lastMsg && now - lastMsg < THIRTY_DAYS_MS) activeCount++;
        const created = new Date(c.created_at).getTime();
        if (created >= weekAgo) weeklyNewCount++;
      }
    }

    const totalCount = contacts?.length ?? 0;
    const weeklyPercent =
      totalCount > 0 ? Math.round((weeklyNewCount / totalCount) * 100) : 0;

    return NextResponse.json({
      totalContacts: totalCount,
      activeContacts: activeCount,
      segmentCount,
      weeklyNewContacts: weeklyNewCount,
      weeklyNewPercent: weeklyPercent,
      avgClv: null as number | null, // — if no order data
    });
  } catch (err) {
    console.error('GET /api/contacts/stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
