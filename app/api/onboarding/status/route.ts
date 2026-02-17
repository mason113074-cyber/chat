import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }

    const { data, error } = await supabase
      .from('users')
      .select(
        'store_name, industry, onboarding_completed, line_channel_id, system_prompt, ai_model'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Onboarding status error:', error);
      return NextResponse.json({ error: '無法取得進度' }, { status: 500 });
    }

    return NextResponse.json({
      store_name: data?.store_name ?? null,
      industry: data?.industry ?? null,
      onboarding_completed: data?.onboarding_completed ?? false,
      line_channel_id: data?.line_channel_id ?? null,
      system_prompt: data?.system_prompt ?? null,
      ai_model: data?.ai_model ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
