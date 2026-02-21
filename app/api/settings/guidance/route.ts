import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

const MAX_RULES = 20;
const MAX_CONTENT_LENGTH = 500;

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }
    const { data, error } = await supabase
      .from('ai_guidance_rules')
      .select('id, rule_title, rule_content, is_enabled, priority')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });
    if (error) {
      console.error('Guidance GET error:', error);
      return NextResponse.json({ error: '取得失敗' }, { status: 500 });
    }
    return NextResponse.json({ rules: data ?? [] });
  } catch (e) {
    console.error('Guidance GET error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }
    const { count } = await supabase
      .from('ai_guidance_rules')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count ?? 0) >= MAX_RULES) {
      return NextResponse.json({ error: '已達規則上限（20 條）' }, { status: 400 });
    }
    const body = await request.json();
    const { rule_title, rule_content } = body;
    if (typeof rule_title !== 'string' || !rule_title.trim()) {
      return NextResponse.json({ error: '規則標題必填' }, { status: 400 });
    }
    if (typeof rule_content !== 'string' || !rule_content.trim()) {
      return NextResponse.json({ error: '規則內容必填' }, { status: 400 });
    }
    const content = rule_content.trim().slice(0, MAX_CONTENT_LENGTH);
    const { data, error } = await supabase
      .from('ai_guidance_rules')
      .insert({
        user_id: user.id,
        rule_title: rule_title.trim().slice(0, 100),
        rule_content: content,
      })
      .select()
      .single();
    if (error) {
      console.error('Guidance POST error:', error);
      return NextResponse.json({ error: '新增失敗' }, { status: 500 });
    }
    return NextResponse.json({ rule: data });
  } catch (e) {
    console.error('Guidance POST error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }
    const body = await request.json();
    const { id, rule_title, rule_content, is_enabled, priority } = body;
    if (typeof id !== 'string') return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof rule_title === 'string') updates.rule_title = rule_title.trim().slice(0, 100);
    if (typeof rule_content === 'string') updates.rule_content = rule_content.trim().slice(0, MAX_CONTENT_LENGTH);
    if (typeof is_enabled === 'boolean') updates.is_enabled = is_enabled;
    if (typeof priority === 'number') updates.priority = priority;
    const { data, error } = await supabase
      .from('ai_guidance_rules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) {
      console.error('Guidance PUT error:', error);
      return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
    return NextResponse.json({ rule: data });
  } catch (e) {
    console.error('Guidance PUT error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    const { error } = await supabase
      .from('ai_guidance_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Guidance DELETE error:', error);
      return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Guidance DELETE error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
