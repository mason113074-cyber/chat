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

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, tags')
      .eq('user_id', user.id);

    const tagCounts: Record<string, number> = {};
    for (const c of contacts ?? []) {
      const tags = (c.tags as string[] | null) ?? [];
      for (const tag of tags) {
        if (tag && tag.trim()) {
          const t = tag.trim();
          tagCounts[t] = (tagCounts[t] ?? 0) + 1;
        }
      }
    }

    const list = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count,
    }));
    list.sort((a, b) => a.tag.localeCompare(b.tag));

    return NextResponse.json({ tags: list });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
