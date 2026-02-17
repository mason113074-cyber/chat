import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const body = await request.json();
    const tagId = body?.tag_id;
    if (!tagId || typeof tagId !== 'string') return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });

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

    const { data, error } = await supabase
      .from('contact_tag_assignments')
      .insert([{ contact_id: contactId, tag_id: tagId, assigned_by: 'manual' }])
      .select('id, contact_id, tag_id, assigned_by')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Tag already assigned' }, { status: 409 });
      console.error('POST /api/contacts/[id]/tags error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: tag } = await supabase
      .from('contact_tags')
      .select('id, name, color')
      .eq('id', tagId)
      .single();

    return NextResponse.json({ assignment: data, tag: tag ?? { id: tagId, name: '', color: 'gray' } });
  } catch (err) {
    console.error('POST /api/contacts/[id]/tags error:', err);
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 });
  }
}
