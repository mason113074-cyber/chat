import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: keyId } = await params;
    if (!keyId) return NextResponse.json({ error: 'Missing key id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('api_keys delete error:', error);
      return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/settings/api-keys/[id] error:', err);
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }
}
