import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    let user = auth?.user ?? null;
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }

    // 確認 workflow 屬於該 user
    const { data: workflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!workflow) {
      return NextResponse.json({ error: '找不到工作流程' }, { status: 404 });
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? '20', 10) || 20));

    const { data, error } = await supabase
      .from('workflow_logs')
      .select('id, status, executed_nodes, error, created_at')
      .eq('workflow_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('GET /api/workflows/[id]/logs:', error);
      return NextResponse.json({ error: '取得紀錄失敗' }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (err) {
    console.error('GET /api/workflows/[id]/logs error:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
