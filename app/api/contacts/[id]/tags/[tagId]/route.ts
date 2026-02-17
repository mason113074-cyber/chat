import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string; tagId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: contactId, tagId } = await params;
    if (!contactId || !tagId) return NextResponse.json({ error: 'Missing contact or tag id' }, { status: 400 });

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

    const { error } = await supabase
      .from('contact_tag_assignments')
      .delete()
      .eq('contact_id', contactId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('DELETE /api/contacts/[id]/tags/[tagId] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/contacts/[id]/tags/[tagId] error:', err);
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
