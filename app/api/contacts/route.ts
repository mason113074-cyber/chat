import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, line_user_id, name, created_at, conversations(id, created_at)')
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

    type Conv = { id: string; created_at: string };
    const out = contacts.map((c) => {
      const convs = (c.conversations as Conv[]) ?? [];
      const conversationCount = convs.length;
      const lastInteraction = convs.length > 0
        ? convs.reduce((latest, conv) =>
            new Date(conv.created_at) > new Date(latest) ? conv.created_at : latest,
            convs[0].created_at)
        : null;
      return {
        id: c.id,
        name: c.name,
        line_user_id: c.line_user_id,
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
