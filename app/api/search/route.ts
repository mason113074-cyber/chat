import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({
        conversations: [],
        contacts: [],
        knowledge: [],
      });
    }

    const pattern = `%${q}%`;

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    let conversations: { id: string; contact_id: string; contact_name: string; content_preview: string; created_at: string }[] = [];
    if (contactIds.length > 0) {
      const { data: convRows } = await supabase
        .from('conversations')
        .select('id, contact_id, message, created_at')
        .in('contact_id', contactIds)
        .ilike('message', pattern)
        .order('created_at', { ascending: false })
        .limit(5);
      if (convRows?.length) {
        const cids = [...new Set(convRows.map((r) => r.contact_id))];
        const { data: names } = await supabase
          .from('contacts')
          .select('id, name')
          .in('id', cids);
        const nameMap = new Map((names ?? []).map((n) => [n.id, n.name ?? '未命名']));
        conversations = convRows.map((r) => ({
          id: r.id,
          contact_id: r.contact_id,
          contact_name: nameMap.get(r.contact_id) ?? '未命名',
          content_preview: (r.message ?? '').slice(0, 60),
          created_at: r.created_at,
        }));
      }
    }

    const { data: contactList } = await supabase
      .from('contacts')
      .select('id, name, line_user_id, tags')
      .eq('user_id', user.id)
      .or(`name.ilike.${pattern},line_user_id.ilike.${pattern}`)
      .limit(5);
    const contacts = (contactList ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? null,
      line_user_id: c.line_user_id,
      tags: (c.tags as string[] | null) ?? [],
    }));

    const { data: kbRows } = await supabase
      .from('knowledge_base')
      .select('id, title, category, content')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5);
    const knowledge = (kbRows ?? []).map((k) => ({
      id: k.id,
      title: k.title,
      category: k.category ?? 'general',
      content_preview: (k.content ?? '').slice(0, 60),
    }));

    return NextResponse.json({
      conversations,
      contacts,
      knowledge,
    });
  } catch (err) {
    console.error('GET /api/search error:', err);
    return NextResponse.json({ error: '搜尋失敗' }, { status: 500 });
  }
}
