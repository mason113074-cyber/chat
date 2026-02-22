import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string; suggestionId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: contactId, suggestionId } = await params;
    if (!contactId || !suggestionId) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

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

    const { data: deleted, error } = await supabase
      .from('ai_suggestions')
      .delete()
      .eq('id', suggestionId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Table not available' }, { status: 501 });
      }
      console.error('DELETE /api/conversations/[id]/suggestions/[suggestionId] error:', error);
      return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 });
    }
    if (!deleted) return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error('DELETE /api/conversations/[id]/suggestions/[suggestionId] error:', error);
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 });
  }
}
