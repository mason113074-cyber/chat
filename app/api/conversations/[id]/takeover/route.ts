import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: latest } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return NextResponse.json({ error: 'No conversation yet' }, { status: 400 });

    const { data: updated, error } = await supabase
      .from('conversations')
      .update({
        status: 'needs_human',
        is_resolved: false,
        resolved_by: 'human',
      })
      .eq('id', latest.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: updated });
  } catch (e) {
    console.error('PUT /api/conversations/[id]/takeover error:', e);
    return NextResponse.json({ error: 'Failed to takeover conversation' }, { status: 500 });
  }
}

