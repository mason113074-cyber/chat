import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CATEGORIES = ['general', '常見問題', '產品資訊', '退換貨政策', '營業資訊', '其他'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json();
    const updates: { title?: string; content?: string; category?: string; is_active?: boolean; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.title === 'string') updates.title = body.title.trim().slice(0, 200);
    if (typeof body.content === 'string') updates.content = body.content.trim();
    if (body.category && CATEGORIES.includes(body.category)) updates.category = body.category;
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

    if (updates.title === '') return NextResponse.json({ error: '標題不可為空' }, { status: 400 });

    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
    return NextResponse.json({ item: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
