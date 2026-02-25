import { NextRequest, NextResponse } from 'next/server';
import { generateReply } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';
import { searchKnowledgeForUser } from '@/lib/knowledge';
import { getConversationUsageForUser } from '@/lib/billing-usage';
import { detectSensitiveKeywords } from '@/lib/security/sensitive-keywords';

const KNOWLEDGE_PREFIX =
  '\n\n## 以下是你可以參考的知識庫內容（只能根據以下內容回答，勿使用其他知識）：\n';
const KNOWLEDGE_EMPTY_INSTRUCTION =
  '\n\n注意：知識庫中沒有找到與此問題相關的內容，請回覆需要轉接專人，勿自行編造答案。';
const SENSITIVE_CONTENT_ERROR = '此問題涉及敏感內容，建議聯繫人工客服。';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;
    /** 選填：預覽用。若有傳入則使用，不讀 DB（供設定頁「測試 AI」預覽未儲存的 system prompt） */
    const systemPromptOverride = body?.systemPrompt;
    const aiModelOverride = body?.aiModel;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      );
    }

    const sensitiveCheck = detectSensitiveKeywords(message);
    if (sensitiveCheck.riskLevel !== 'low') {
      return NextResponse.json(
        { error: SENSITIVE_CONTENT_ERROR },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { limit, used } = await getConversationUsageForUser(supabase, user.id);
    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        { error: '已達到本月對話上限，請升級方案' },
        { status: 402 }
      );
    }

    let systemPrompt: string | null;
    let aiModel: string | null;

    if (systemPromptOverride !== undefined && systemPromptOverride !== null) {
      systemPrompt = typeof systemPromptOverride === 'string' ? systemPromptOverride : null;
      aiModel = typeof aiModelOverride === 'string' ? aiModelOverride : null;
    } else {
      const { data } = await supabase
        .from('users')
        .select('system_prompt, ai_model')
        .eq('id', user.id)
        .maybeSingle();
      systemPrompt = data?.system_prompt ?? null;
      aiModel = data?.ai_model ?? null;
    }

    const knowledgeText = await searchKnowledgeForUser(user.id, message, 3, 2000);
    systemPrompt = (systemPrompt?.trim() ?? '') + (knowledgeText ? KNOWLEDGE_PREFIX + knowledgeText : KNOWLEDGE_EMPTY_INSTRUCTION);

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
