import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tags } = await supabase
      .from('contact_tags')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name');

    const tagIds = (tags ?? []).map((t) => t.id);

    let assignmentCounts: Record<string, number> = {};
    if (tagIds.length > 0) {
      const { data: assignments } = await supabase
        .from('contact_tag_assignments')
        .select('tag_id')
        .in('tag_id', tagIds);

      for (const a of assignments ?? []) {
        assignmentCounts[a.tag_id] = (assignmentCounts[a.tag_id] ?? 0) + 1;
      }
    }

    const list = (tags ?? []).map((t) => ({
      tag: t.name,
      count: assignmentCounts[t.id] ?? 0,
      id: t.id,
      color: t.color,
    }));

    return NextResponse.json({ tags: list });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
