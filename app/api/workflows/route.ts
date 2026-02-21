import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    let user = auth?.user ?? null;
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      user = u;
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('GET /api/workflows:', error);
      return NextResponse.json({ error: '無法取得工作流程列表' }, { status: 500 });
    }

    return NextResponse.json({ workflows: data ?? [] });
  } catch (err) {
    console.error('GET /api/workflows error:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    let user = auth?.user ?? null;
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      user = u;
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : null;

    if (!name) {
      return NextResponse.json({ error: '名稱為必填' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        is_active: false,
        nodes: [],
        edges: [],
      })
      .select('id, name, description, is_active, nodes, edges, created_at, updated_at')
      .single();

    if (error) {
      console.error('POST /api/workflows:', error);
      return NextResponse.json({ error: '建立失敗' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/workflows error:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
