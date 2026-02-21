import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10) || 50);

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .single();
    if (!contact || contact.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let q = supabase
      .from('customer_events')
      .select('id, event_type, event_name, metadata, source, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (type) q = q.eq('event_type', type);
    const { data: events, error } = await q;
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ events: [] }); // table doesn't exist
      throw error;
    }
    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error('GET /api/contacts/[id]/events error:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;
    const auth = await getAuthFromRequest(request);
    const supabase = auth?.supabase ?? await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .single();
    if (!contact || contact.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const eventType = (body.event_type as string) || 'custom';
    const eventName = (body.event_name as string) || '自訂事件';
    const metadata = body.metadata ?? null;
    const source = 'manual';

    const { data: evt, error } = await supabase
      .from('customer_events')
      .insert([{ contact_id: contactId, user_id: user.id, event_type: eventType, event_name: eventName, metadata, source }])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
      throw error;
    }
    return NextResponse.json({ event: evt });
  } catch (err) {
    console.error('POST /api/contacts/[id]/events error:', err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
