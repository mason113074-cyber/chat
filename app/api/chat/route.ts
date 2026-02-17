import { NextRequest, NextResponse } from 'next/server';
import { generateReply } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';
import { searchKnowledgeForUser } from '@/lib/knowledge';

const KNOWLEDGE_PREFIX = '\n\n以下是相關的知識庫資料，請優先參考這些資訊來回答：\n';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let systemPrompt: string | null = null;
    let aiModel: string | null = null;

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('system_prompt, ai_model')
        .eq('id', user.id)
        .maybeSingle();
      systemPrompt = data?.system_prompt ?? null;
      aiModel = data?.ai_model ?? null;

      const knowledgeText = await searchKnowledgeForUser(user.id, message, 3, 2000);
      if (knowledgeText) {
        systemPrompt = (systemPrompt?.trim() ?? '') + KNOWLEDGE_PREFIX + knowledgeText;
      }
    }

    const content = await generateReply(message, systemPrompt, aiModel);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
