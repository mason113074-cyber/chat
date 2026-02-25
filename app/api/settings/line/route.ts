import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/encrypt';

function mask(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '- - - - - - - - ';
  return '- - - - ' + value.slice(-4);
}

function tryDecrypt(value: string | null): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('users')
    .select('line_channel_id, line_channel_secret, line_channel_access_token')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('LINE settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const secret = tryDecrypt(data?.line_channel_secret ?? null);
  const token = tryDecrypt(data?.line_channel_access_token ?? null);

  return NextResponse.json({
    channel_id: data?.line_channel_id ?? '',
    channel_secret_masked: mask(secret),
    access_token_masked: mask(token),
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const updates: Record<string, string> = {};
  if (typeof body.channel_id === 'string' && body.channel_id.trim()) {
    updates.line_channel_id = body.channel_id.trim().slice(0, 100);
  }
  if (typeof body.channel_secret === 'string' && body.channel_secret.trim() && !body.channel_secret.startsWith('- - - -')) {
    updates.line_channel_secret = encrypt(body.channel_secret.trim().slice(0, 200));
  }
  if (typeof body.access_token === 'string' && body.access_token.trim() && !body.access_token.startsWith('- - - -')) {
    updates.line_channel_access_token = encrypt(body.access_token.trim());
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await supabase.from('users').update(updates).eq('id', user.id);

  if (error) {
    console.error('LINE settings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
