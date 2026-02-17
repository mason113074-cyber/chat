import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CATEGORIES = ['general', '常見問題', '產品資訊', '退換貨政策', '營業資訊', '其他'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const category = request.nextUrl.searchParams.get('category')?.trim() || '';

    let q = supabase
      .from('knowledge_base')
      .select('id, title, content, category, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (category && CATEGORIES.includes(category)) {
      q = q.eq('category', category);
    }
    if (search) {
      q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) {
      console.error(error);
      return NextResponse.json({ error: '取得失敗' }, { status: 500 });
    }
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

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
    return NextResponse.json({ item: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
