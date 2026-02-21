import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('id, name, status, channel, target_count, sent_count, delivered_count, read_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('GET /api/campaigns/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}
