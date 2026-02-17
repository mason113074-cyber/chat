import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, line_user_id, created_at')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: assignments } = await supabase
      .from('contact_tag_assignments')
      .select('tag_id, assigned_by')
      .eq('contact_id', contactId);

    const tagIds = [...new Set((assignments ?? []).map((a) => a.tag_id))];
    const { data: tagRows } = await supabase
      .from('contact_tags')
      .select('id, name, color')
      .in('id', tagIds);
    const tagMap = new Map((tagRows ?? []).map((t) => [t.id, t]));
    const assignmentMap = new Map((assignments ?? []).map((a) => [a.tag_id, a.assigned_by ?? 'manual']));

    const tags = tagIds
      .map((tid) => {
        const tag = tagMap.get(tid);
        if (!tag) return null;
        return { id: tag.id, name: tag.name, color: tag.color, assigned_by: assignmentMap.get(tid) ?? 'manual' };
      })
      .filter(Boolean) as { id: string; name: string; color: string; assigned_by: string }[];

    return NextResponse.json({ contact: { ...contact, tags } });
  } catch (err) {
    console.error('GET /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}
