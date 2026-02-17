import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing tag id' }, { status: 400 });

    const body = await request.json();
    const name = body?.name?.trim();
    const color = body?.color;
    const updates: { name?: string; color?: string } = {};
    if (typeof name === 'string') updates.name = name;
    if (typeof color === 'string') updates.color = color;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No updates' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('contact_tags')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, color, created_at')
      .single();

    if (error) {
      console.error('PATCH /api/contacts/tags/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('PATCH /api/contacts/tags/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing tag id' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase
      .from('contact_tag_assignments')
      .delete()
      .eq('tag_id', id);

    const { error } = await supabase
      .from('contact_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('DELETE /api/contacts/tags/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/contacts/tags/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
