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

    let query = supabase
      .from('ai_suggestions')
      .select(
        'id, source_message_id, draft_text, action, category, confidence, reason, sources, status, approved_by, approved_at, sent_at, created_at'
      )
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (normalizedStatus !== 'all') {
      query = query.eq('status', normalizedStatus);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ suggestions: [] });
      console.error('GET /api/conversations/[id]/suggestions error:', error);
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }

    return NextResponse.json({ suggestions: data ?? [] });
  } catch (error) {
    console.error('GET /api/conversations/[id]/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
