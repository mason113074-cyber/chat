import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/contacts/[id]/suggestions
 * Returns draft ai_suggestions for this contact (RLS: user owns contact).
 */
export async function GET(_request: Request, { params }: RouteParams) {
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
      .maybeSingle();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('id, event_id, user_message, suggested_reply, sources_count, confidence_score, risk_category, status, created_at, expires_at')
      .eq('contact_id', contactId)
      .eq('status', 'draft')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/contacts/[id]/suggestions error:', error);
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
    return NextResponse.json({ suggestions: suggestions ?? [] });
  } catch (e) {
    console.error('GET /api/contacts/[id]/suggestions error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
