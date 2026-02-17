import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { generateReply } from '@/lib/openai';
import { searchKnowledgeWithSources } from '@/lib/knowledge-search';

const KNOWLEDGE_PREFIX = '\n\n以下是相關的知識庫資料，請優先參考這些資訊來回答：\n';

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

    const body = await request.json();
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) return NextResponse.json({ error: '請提供 question' }, { status: 400 });

    const { data: userRow } = await supabase
      .from('users')
      .select('system_prompt, ai_model')
      .eq('id', user.id)
      .maybeSingle();

    const systemPrompt = userRow?.system_prompt ?? null;
    const aiModel = userRow?.ai_model ?? null;

    const { text: knowledgeText, sources } = await searchKnowledgeWithSources(
      user.id,
      question,
      3,
      2000
    );

    const fullSystemPrompt = knowledgeText
      ? (systemPrompt?.trim() ?? '') + KNOWLEDGE_PREFIX + knowledgeText
      : systemPrompt;

    const answer = await generateReply(question, fullSystemPrompt, aiModel);

    return NextResponse.json({
      answer,
      sources: sources.map((s) => ({ id: s.id, title: s.title, category: s.category })),
    });
  } catch (e) {
    console.error('Knowledge base test error:', e);
    return NextResponse.json({ error: '產生回覆時發生錯誤' }, { status: 500 });
  }
}
