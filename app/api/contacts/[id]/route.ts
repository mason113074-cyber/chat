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
      .select('id, name, line_user_id, email, phone, notes, csat_score, top_topic, created_at')
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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const updates: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      csat_score?: number | null;
      top_topic?: string | null;
    } = {};

    if (typeof body.name === 'string') updates.name = body.name.trim() || null;
    if (typeof body.email === 'string') updates.email = body.email.trim() || null;
    if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null;
    if (typeof body.notes === 'string') updates.notes = body.notes.trim() || null;
    if (typeof body.top_topic === 'string') updates.top_topic = body.top_topic.trim() || null;
    if (typeof body.csat_score === 'number') {
      updates.csat_score = Number.isFinite(body.csat_score) ? Math.max(0, Math.min(5, body.csat_score)) : null;
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select('id, name, line_user_id, email, phone, notes, csat_score, top_topic, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
  } catch (err) {
    console.error('PATCH /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
