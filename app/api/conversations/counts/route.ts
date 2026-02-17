import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type StatusKey = 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contacts ?? []).map((c) => c.id);
    const total = contactIds.length;

    if (contactIds.length === 0) {
      return NextResponse.json({
        total: 0,
        ai_handled: 0,
        needs_human: 0,
        resolved: 0,
        closed: 0,
      });
    }

    const { data: assistantRows } = await supabase
      .from('conversations')
      .select('contact_id, status, created_at')
      .eq('role', 'assistant')
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false });

    const latestByContact = new Map<string, { status: string | null }>();
    for (const row of assistantRows ?? []) {
      if (!latestByContact.has(row.contact_id)) {
        latestByContact.set(row.contact_id, { status: row.status ?? 'ai_handled' });
      }
    }

    const counts = { ai_handled: 0, needs_human: 0, resolved: 0, closed: 0 };
    for (const id of contactIds) {
      const s = latestByContact.get(id)?.status ?? 'ai_handled';
      const key = (['ai_handled', 'needs_human', 'resolved', 'closed'].includes(s) ? s : 'ai_handled') as StatusKey;
      counts[key]++;
    }

    return NextResponse.json({
      total,
      ai_handled: counts.ai_handled,
      needs_human: counts.needs_human,
      resolved: counts.resolved,
      closed: counts.closed,
    });
  } catch (error) {
    console.error('GET /api/conversations/counts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}
