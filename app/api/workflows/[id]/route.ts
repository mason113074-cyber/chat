import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

type RouteParams = { params: Promise<{ id: string }> };

async function getAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuth(supabase);
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, description, is_active, nodes, edges, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: '取得失敗' }, { status: 500 });
    if (!data) return NextResponse.json({ error: '找不到工作流程' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/workflows/[id]:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    const user = auth?.user ?? await getAuth(supabase);
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim() || null;
    if (typeof body.isActive === 'boolean') updates.is_active = body.isActive;
    if (Array.isArray(body.nodes)) updates.nodes = body.nodes;
    if (Array.isArray(body.edges)) updates.edges = body.edges;

    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('PUT /api/workflows/[id]:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuth(supabase);
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const { error } = await supabase.from('workflows').delete().eq('id', id).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/workflows/[id]:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
