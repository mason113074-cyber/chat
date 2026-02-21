import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const KEY_PREFIX = 'caip_';
const KEY_BYTES = 24;

function generateKey(): { raw: string; hash: string; prefix: string } {
  const raw = KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString('base64url').slice(0, 32);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, KEY_PREFIX.length + 8);
  return { raw, hash, prefix };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('api_keys select error:', error);
      return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
    }
    return NextResponse.json({ keys: keys ?? [] });
  } catch (err) {
    console.error('GET /api/settings/api-keys error:', err);
    return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : 'API Key';
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { raw, hash, prefix } = generateKey();

    const { data: key, error } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, name, key_hash: hash, key_prefix: prefix })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) {
      console.error('api_keys insert error:', error);
      return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
    }
    return NextResponse.json({ key: { ...key, raw_key: raw } });
  } catch (err) {
    console.error('POST /api/settings/api-keys error:', err);
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }
}
