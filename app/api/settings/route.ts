import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 5000;

export async function GET(request: NextRequest) {
  try {
    // 驗證用戶已登入
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      );
    }

    // 讀取用戶的 system_prompt
    const { data, error } = await supabase
      .from('users')
      .select('system_prompt')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching system_prompt:', error);
      return NextResponse.json(
        { error: '無法讀取設定' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      systemPrompt: data?.system_prompt || null 
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
    // 驗證用戶已登入
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { systemPrompt } = body;

    if (typeof systemPrompt !== 'string') {
      return NextResponse.json(
        { error: '無效的 system_prompt 格式' },
        { status: 400 }
      );
    }

    // 驗證 prompt 長度
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

    // 儲存用戶的 system_prompt
    const { error } = await supabase
      .from('users')
      .update({ system_prompt: systemPrompt })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving system_prompt:', error);
      return NextResponse.json(
        { error: '無法儲存設定' },
        { status: 500 }
      );
    }

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
