import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { clearKnowledgeCache } from '@/lib/knowledge-search';

const CATEGORIES = ['general', '常見問題', '產品資訊', '退換貨政策', '營業資訊', '其他'];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }

    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const category = request.nextUrl.searchParams.get('category')?.trim() || '';
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? '50', 10) || 50));
    const offset = (page - 1) * limit;

    let q = supabase
      .from('knowledge_base')
      .select('id, title, content, category, is_active, created_at, updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (category && CATEGORIES.includes(category)) {
      q = q.eq('category', category);
    }
    if (search) {
      q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: '取得失敗' }, { status: 500 });
    }
    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const category = body.category && CATEGORIES.includes(body.category) ? body.category : 'general';
    const isActive = body.is_active !== false;

    if (!title) return NextResponse.json({ error: '請填寫標題' }, { status: 400 });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({ user_id: user.id, title, content, category, is_active: isActive })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: '新增失敗' }, { status: 500 });
    }
    await clearKnowledgeCache(user.id);
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
