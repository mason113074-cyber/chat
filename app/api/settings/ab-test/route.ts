import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

async function getAuthUser(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  let user = auth?.user ?? null;
  const supabase = auth?.supabase ?? await createClient();
  if (!user) {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return null;
    user = u;
  }
  return { user, supabase };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const { data, error } = await auth.supabase
    .from('ab_tests')
    .select('id, name, variant_a_prompt, variant_b_prompt, traffic_split, status, started_at, ended_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('AB test GET error:', error);
    return NextResponse.json({ error: '取得失敗' }, { status: 500 });
  }
  return NextResponse.json({ tests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const body = await request.json();
  const { name, variant_a_prompt, variant_b_prompt, traffic_split } = body;
  if (!name?.trim() || !variant_a_prompt?.trim() || !variant_b_prompt?.trim()) {
    return NextResponse.json({ error: '名稱與兩個 Prompt 皆必填' }, { status: 400 });
  }
  const split = Math.min(100, Math.max(0, Number(traffic_split) || 50));
  const { data, error } = await auth.supabase
    .from('ab_tests')
    .insert({
      user_id: auth.user.id,
      name: String(name).trim().slice(0, 100),
      variant_a_prompt: String(variant_a_prompt).trim(),
      variant_b_prompt: String(variant_b_prompt).trim(),
      traffic_split: split,
      status: 'draft',
    })
    .select()
    .single();
  if (error) {
    console.error('AB test POST error:', error);
    return NextResponse.json({ error: '新增失敗' }, { status: 500 });
  }
  return NextResponse.json({ test: data });
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const body = await request.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
  const updates: Record<string, unknown> = {};
  if (status === 'running') {
    updates.status = 'running';
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updates.status = 'completed';
    updates.ended_at = new Date().toISOString();
  }
  const { data, error } = await auth.supabase
    .from('ab_tests')
    .update(updates)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();
  if (error) {
    console.error('AB test PUT error:', error);
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
  return NextResponse.json({ test: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
  const { error } = await auth.supabase
    .from('ab_tests')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);
  if (error) {
    console.error('AB test DELETE error:', error);
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
