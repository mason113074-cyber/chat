import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = u;
    }

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, line_user_id, name, email, phone, notes, csat_score, top_topic, created_at, conversations(id, created_at, message)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!contacts) return NextResponse.json({ contacts: [] });

    const contactIds = contacts.map((c) => c.id);
    const { data: assignments } = await supabase
      .from('contact_tag_assignments')
      .select('contact_id, tag_id, assigned_by')
      .in('contact_id', contactIds);

    const { data: tagRows } = await supabase
      .from('contact_tags')
      .select('id, name, color')
      .eq('user_id', user.id);
    const tagMap = new Map((tagRows ?? []).map((t) => [t.id, { id: t.id, name: t.name, color: t.color }]));

    const assignmentsByContact = new Map<string, { id: string; name: string; color: string; assigned_by: string }[]>();
    for (const a of assignments ?? []) {
      const tag = tagMap.get(a.tag_id);
      if (!tag) continue;
      const list = assignmentsByContact.get(a.contact_id) ?? [];
      list.push({ id: tag.id, name: tag.name, color: tag.color, assigned_by: a.assigned_by ?? 'manual' });
      assignmentsByContact.set(a.contact_id, list);
    }

    type Conv = { id: string; created_at: string; message?: string | null };
    const out = contacts.map((c) => {
      const convs = (c.conversations as Conv[]) ?? [];
      const conversationCount = convs.length;
      const lastInteraction = convs.length > 0
        ? convs.reduce((latest, conv) =>
            new Date(conv.created_at) > new Date(latest) ? conv.created_at : latest,
            convs[0].created_at)
        : null;

      const keywordFreq = new Map<string, number>();
      for (const conv of convs) {
        const text = (conv.message ?? '').toLowerCase();
        const tokens = text
          .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 2)
          .slice(0, 20);
        for (const token of tokens) {
          keywordFreq.set(token, (keywordFreq.get(token) ?? 0) + 1);
        }
      }
      const computedTopTopic = Array.from(keywordFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        id: c.id,
        name: c.name,
        line_user_id: c.line_user_id,
        email: c.email ?? null,
        phone: c.phone ?? null,
        notes: c.notes ?? null,
        csat_score: c.csat_score ?? null,
        top_topic: c.top_topic ?? computedTopTopic,
        created_at: c.created_at,
        conversationCount,
        lastInteraction,
        tags: assignmentsByContact.get(c.id) ?? [],
      };
    });

    return NextResponse.json({ contacts: out });
  } catch (err) {
    console.error('GET /api/contacts error:', err);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
