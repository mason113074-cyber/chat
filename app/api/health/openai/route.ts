import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const TIMEOUT_MS = 15_000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', message: '未授權，請先登入' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'OpenAI API key 未設定' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a test.' },
          { role: 'user', content: 'Reply with exactly: ok' },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI request timeout')), TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({ status: 'ok', service: 'openai' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'OpenAI 連線失敗';
    console.error('[health/openai]', e);
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}
