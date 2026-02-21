import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = (body.name as string)?.trim() || 'Untitled Campaign';

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([{ user_id: user.id, name, status: 'draft', channel: 'line' }])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
      throw error;
    }
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('POST /api/campaigns error:', err);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, status, channel, target_count, sent_count, delivered_count, read_count, scheduled_at, sent_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ campaigns: [] });
      throw error;
    }
    return NextResponse.json({ campaigns: campaigns ?? [] });
  } catch (err) {
    console.error('GET /api/campaigns error:', err);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
