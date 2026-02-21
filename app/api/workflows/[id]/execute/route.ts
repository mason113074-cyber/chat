import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { WorkflowEngine, type WorkflowData } from '@/lib/workflow-engine';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/workflows/[id]/execute
 * 手動測試執行工作流程（使用 WorkflowEngine）
 */
export async function POST(
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

    const { data: workflow } = await supabase
      .from('workflows')
      .select('id, name, nodes, edges')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!workflow) {
      return NextResponse.json({ error: '找不到工作流程' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const testMessage = typeof body.testMessage === 'string' ? body.testMessage : '';

    const nodes = (workflow.nodes ?? []) as WorkflowData['nodes'];
    const edges = (workflow.edges ?? []) as WorkflowData['edges'];

    const result = await WorkflowEngine.execute(
      { id, name: workflow.name, nodes, edges },
      {
        message: testMessage,
        contactId: '',
        lineUserId: 'test',
        ownerUserId: user.id,
        replyToken: '',
        isNewCustomer: true,
        isOffHours: false,
        variables: {},
        dryRun: true,
      }
    );

    const admin = getSupabaseAdmin();
    const { data: log, error } = await admin
      .from('workflow_logs')
      .insert({
        workflow_id: id,
        status: result.success ? 'success' : 'failed',
        executed_nodes: result.executedNodes,
        error: result.error ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('POST /api/workflows/[id]/execute log insert:', error);
    }

    return NextResponse.json({
      success: result.success,
      testMessage,
      executedNodes: result.executedNodes,
      logId: log?.id ?? null,
      error: result.error ?? undefined,
    });
  } catch (err) {
    console.error('POST /api/workflows/[id]/execute error:', err);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
