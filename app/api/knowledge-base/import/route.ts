import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearKnowledgeCache } from '@/lib/knowledge-search';

const CATEGORIES = ['general', '常見問題', '產品資訊', '退換貨政策', '營業資訊', '其他'];

type ImportRow = { title: string; content: string; category?: string };

function normalizeCategory(c: unknown): string {
  if (typeof c === 'string' && CATEGORIES.includes(c)) return c;
  return 'general';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json();
    const rows = Array.isArray(body.items) ? body.items : Array.isArray(body) ? body : [];
    if (rows.length === 0) return NextResponse.json({ error: '請提供 items 陣列' }, { status: 400 });

    const toInsert: ImportRow[] = [];
    for (const r of rows) {
      const title = typeof r.title === 'string' ? r.title.trim().slice(0, 200) : String(r.title ?? '').slice(0, 200);
      const content = typeof r.content === 'string' ? r.content.trim() : String(r.content ?? '');
      if (title) toInsert.push({ title, content, category: normalizeCategory(r.category) });
    }

    if (toInsert.length === 0) return NextResponse.json({ error: '無有效條目可匯入' }, { status: 400 });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(
        toInsert.map((r) => ({
          user_id: user.id,
          title: r.title,
          content: r.content,
          category: r.category ?? 'general',
          is_active: true,
        }))
      )
      .select('id');

    if (error) {
      console.error(error);
      return NextResponse.json({ error: '匯入失敗' }, { status: 500 });
    }
    await clearKnowledgeCache(user.id);
    return NextResponse.json({ imported: data?.length ?? toInsert.length, ids: data?.map((x) => x.id) ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
