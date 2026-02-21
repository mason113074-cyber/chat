import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: notes, error } = await supabase
      .from('conversation_notes')
      .select('id, body, created_at, user_id')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ notes: [] });
      console.error('conversation_notes select error:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
    return NextResponse.json({ notes: notes ?? [] });
  } catch (err) {
    console.error('GET /api/contacts/[id]/notes error:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) return NextResponse.json({ error: 'Body is required' }, { status: 400 });

    const { data: note, error } = await supabase
      .from('conversation_notes')
      .insert({ contact_id: contactId, user_id: user.id, body: text })
      .select('id, body, created_at, user_id')
      .single();

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Table not available' }, { status: 501 });
      console.error('conversation_notes insert error:', error);
      return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
    }
    return NextResponse.json({ note });
  } catch (err) {
    console.error('POST /api/contacts/[id]/notes error:', err);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
