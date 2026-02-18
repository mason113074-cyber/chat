import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { invalidateUserSettingsCache } from '@/lib/supabase';

const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 5000;

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      user = u;
    }

    const { data, error } = await supabase
      .from('users')
      .select('system_prompt, ai_model, store_name, quick_replies')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: '無法讀取設定' },
        { status: 500 }
      );
    }

    const quickReplies = Array.isArray(data?.quick_replies) ? data.quick_replies : [];

    return NextResponse.json({
      systemPrompt: data?.system_prompt ?? null,
      aiModel: data?.ai_model ?? 'gpt-4o-mini',
      storeName: data?.store_name ?? null,
      quickReplies,
    });
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      user = u;
    }

    const body = await request.json();
    const { systemPrompt, storeName, aiModel, quickReplies } = body;

    if (typeof systemPrompt !== 'string') {
      return NextResponse.json(
        { error: '無效的 system_prompt 格式' },
        { status: 400 }
      );
    }

    if (systemPrompt.trim().length < MIN_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `System prompt 至少需要 ${MIN_PROMPT_LENGTH} 個字元` },
        { status: 400 }
      );
    }

    if (systemPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `System prompt 不能超過 ${MAX_PROMPT_LENGTH} 個字元` },
        { status: 400 }
      );
    }

    const updates: {
      system_prompt: string;
      store_name?: string | null;
      ai_model?: string;
      quick_replies?: unknown;
    } = { system_prompt: systemPrompt };
    if (typeof storeName === 'string') updates.store_name = storeName.trim().slice(0, 100) || null;
    if (typeof aiModel === 'string' && ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'].includes(aiModel)) {
      updates.ai_model = aiModel;
    }
    if (Array.isArray(quickReplies)) {
      const valid = quickReplies
        .filter(
          (r: unknown) =>
            r !== null &&
            typeof r === 'object' &&
            'id' in r &&
            'text' in r &&
            'enabled' in r &&
            typeof (r as { id: unknown }).id === 'string' &&
            typeof (r as { text: unknown }).text === 'string' &&
            typeof (r as { enabled: unknown }).enabled === 'boolean'
        )
        .slice(0, 5)
        .map((r: { id: string; text: string; enabled: boolean }) => ({
          id: String(r.id),
          text: String(r.text).slice(0, 100),
          enabled: Boolean(r.enabled),
        }));
      updates.quick_replies = valid;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error saving system_prompt:', error);
      return NextResponse.json(
        { error: '無法儲存設定' },
        { status: 500 }
      );
    }

    await invalidateUserSettingsCache(user.id);

    return NextResponse.json({ 
      success: true,
      message: '設定已儲存' 
    });
  } catch (error) {
    console.error('Settings POST API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
