import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    if (!contactId) {
      return NextResponse.json(
        { error: 'Missing conversation id' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const tags = body?.tags;
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Invalid body: tags must be an array' },
        { status: 400 }
      );
    }

    const normalizedTags = tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .update({ tags: normalizedTags })
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select('id, tags')
      .single();

    if (error) {
      console.error('PATCH /api/conversations/[id]/tags error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update tags' },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ tags: (data.tags as string[]) ?? [] });
  } catch (error) {
    console.error('PATCH /api/conversations/[id]/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    );
  }
}
