import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { DEFAULT_TAGS } from '@/lib/contact-tags';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = u;
    }

    let { data: tags, error } = await supabase
      .from('contact_tags')
      .select('id, name, color, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('GET /api/contacts/tags error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tags || tags.length === 0) {
      const insert = DEFAULT_TAGS.map((t) => ({ user_id: user.id, name: t.name, color: t.color }));
      const { data: inserted, error: insertError } = await supabase
        .from('contact_tags')
        .insert(insert)
        .select('id, name, color, created_at');
      if (insertError) {
        console.error('Seed default tags error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      tags = inserted ?? [];
    }

    return NextResponse.json({ tags });
  } catch (err) {
    console.error('GET /api/contacts/tags error:', err);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const color = body?.color ?? 'gray';
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = u;
    }

    const { data, error } = await supabase
      .from('contact_tags')
      .insert([{ user_id: user.id, name, color }])
      .select('id, name, color, created_at')
      .single();

    if (error) {
      console.error('POST /api/contacts/tags error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/contacts/tags error:', err);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
