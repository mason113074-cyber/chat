import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

const STATUS_MAP: Record<
  string,
  { status: string; is_resolved: boolean; resolved_by: string | null }
> = {
  resolved: { status: 'resolved', is_resolved: true, resolved_by: 'human' },
  needs_human: { status: 'needs_human', is_resolved: false, resolved_by: null },
  closed: { status: 'closed', is_resolved: true, resolved_by: 'human' },
  ai_handled: { status: 'ai_handled', is_resolved: false, resolved_by: null },
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
    }

    const body = await request.json();
    const status = body?.status;
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Invalid body: status is required' }, { status: 400 });
    }
    const mapping = STATUS_MAP[status];
    if (!mapping) {
      return NextResponse.json(
        { error: 'Invalid status. Use: resolved, needs_human, closed, ai_handled' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    if (!contact) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: latest } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) {
      return NextResponse.json(
        { error: 'No assistant message to update. Send a message first.' },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('conversations')
      .update({
        status: mapping.status,
        is_resolved: mapping.is_resolved,
        resolved_by: mapping.resolved_by,
      })
      .eq('id', latest.id)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/conversations/[id]/status error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/conversations/[id]/status error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
