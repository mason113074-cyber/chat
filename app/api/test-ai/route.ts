import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const MAX_TEST_RESPONSE_TOKENS = 500;

export async function POST(request: NextRequest) {
  try {
    // 檢查 OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key 未設定' },
        { status: 500 }
      );
    }

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
    const { message, systemPrompt } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '缺少必要參數：message' },
        { status: 400 }
      );
    }

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return NextResponse.json(
        { error: '缺少必要參數：systemPrompt' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: MAX_TEST_RESPONSE_TOKENS,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: 'AI 未產生回覆' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Test AI API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '無法產生 AI 回覆' },
      { status: 500 }
    );
  }
}
