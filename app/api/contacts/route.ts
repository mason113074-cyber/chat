import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

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

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get('pageSize')) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * pageSize;

    const baseCols = 'id, line_user_id, name, email, phone, notes, csat_score, top_topic, created_at';
    let contacts: Array<Record<string, unknown>> | null = null;

    const { count: totalCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: data1, error: selErr } = await supabase
      .from('contacts')
      .select(baseCols + ', source, lifecycle_stage')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (selErr?.code === '42703') {
      const { data: fallback } = await supabase
        .from('contacts')
        .select(baseCols)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      for (const c of fallback ?? []) {
        (c as Record<string, unknown>).source = 'line';
        (c as Record<string, unknown>).lifecycle_stage = 'new_customer';
      }
      contacts = fallback ?? [];
    } else {
      contacts = data1 as Array<Record<string, unknown>> | null;
    }
    if (!contacts) return NextResponse.json({ contacts: [], pagination: { page, pageSize, total: 0 } });

    const contactIds = contacts.map((c) => c.id as string);

    const [{ data: assignments }, { data: tagRows }, { data: convCounts }] = await Promise.all([
      supabase
        .from('contact_tag_assignments')
        .select('contact_id, tag_id, assigned_by')
        .in('contact_id', contactIds),
      supabase
        .from('contact_tags')
        .select('id, name, color')
        .eq('user_id', user.id),
      supabase
        .from('conversations')
        .select('contact_id')
        .in('contact_id', contactIds),
    ]);

    const tagMap = new Map((tagRows ?? []).map((t) => [t.id, { id: t.id, name: t.name, color: t.color }]));

    const assignmentsByContact = new Map<string, { id: string; name: string; color: string; assigned_by: string }[]>();
    for (const a of assignments ?? []) {
      const tag = tagMap.get(a.tag_id);
      if (!tag) continue;
      const list = assignmentsByContact.get(a.contact_id) ?? [];
      list.push({ id: tag.id, name: tag.name, color: tag.color, assigned_by: a.assigned_by ?? 'manual' });
      assignmentsByContact.set(a.contact_id, list);
    }

    const convCountByContact = new Map<string, number>();
    for (const row of convCounts ?? []) {
      convCountByContact.set(row.contact_id, (convCountByContact.get(row.contact_id) ?? 0) + 1);
    }

    type Row = Record<string, unknown> & { id: string };
    const out = (contacts as Row[]).map((c) => ({
      id: c.id,
      name: c.name,
      line_user_id: c.line_user_id,
      email: c.email ?? null,
      phone: c.phone ?? null,
      notes: c.notes ?? null,
      csat_score: c.csat_score ?? null,
      top_topic: c.top_topic ?? null,
      created_at: c.created_at,
      source: (c.source as string | undefined) ?? 'line',
      lifecycle_stage: (c.lifecycle_stage as string | undefined) ?? 'new_customer',
      conversationCount: convCountByContact.get(c.id) ?? 0,
      lastInteraction: null,
      tags: assignmentsByContact.get(c.id) ?? [],
    }));

    return NextResponse.json({
      contacts: out,
      pagination: {
        page,
        pageSize,
        total: totalCount ?? 0,
        totalPages: Math.ceil((totalCount ?? 0) / pageSize),
      },
    });
  } catch (err) {
    console.error('GET /api/contacts error:', err);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
