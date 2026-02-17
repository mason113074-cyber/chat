import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const { data: rows, error } = await supabase
      .from('knowledge_base')
      .select('id, is_active, updated_at, category')
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: '取得失敗' }, { status: 500 });
    }

    const list = rows ?? [];
    const total = list.length;
    const activeCount = list.filter((r) => r.is_active).length;
    const lastUpdated =
      list.length > 0
        ? list.reduce((max, r) => (r.updated_at && (!max || r.updated_at > max) ? r.updated_at : max), '')
        : null;
    const byCategory: Record<string, number> = {};
    for (const r of list) {
      const c = r.category ?? 'general';
      byCategory[c] = (byCategory[c] ?? 0) + 1;
    }

    return NextResponse.json({ total, activeCount, lastUpdated, byCategory });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
