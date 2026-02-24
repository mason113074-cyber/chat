import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const statusParam = request.nextUrl.searchParams.get('status') ?? 'pending';
    const allowedStatus = new Set(['pending', 'approved', 'sent', 'all']);
    const normalizedStatus = allowedStatus.has(statusParam) ? statusParam : 'pending';
    const statusFilter = normalizedStatus === 'pending' ? 'draft' : normalizedStatus;

    let query = supabase
      .from('ai_suggestions')
      .select(
        'id, event_id, user_message, suggested_reply, sources_count, confidence_score, risk_category, category, sources, status, sent_at, created_at, expires_at'
      )
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ suggestions: [] });
      console.error('GET /api/conversations/[id]/suggestions error:', error);
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }

    const suggestions = (data ?? []).map((row) => ({
      ...row,
      draft_text: row.suggested_reply,
      status: row.status === 'draft' ? 'pending' : row.status,
    }));
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('GET /api/conversations/[id]/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
