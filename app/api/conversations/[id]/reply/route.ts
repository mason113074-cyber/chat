import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { insertConversationMessage } from '@/lib/supabase';
import { pushMessage } from '@/lib/line';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, line_user_id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await pushMessage(contact.line_user_id, { type: 'text', text: message });

    const inserted = await insertConversationMessage(contactId, message, 'assistant', {
      status: 'needs_human',
      resolved_by: 'human',
      is_resolved: false,
    });

    return NextResponse.json({ success: true, item: inserted });
  } catch (e) {
    console.error('POST /api/conversations/[id]/reply error:', e);
    return NextResponse.json({ error: 'Failed to send human reply' }, { status: 500 });
  }
}

