import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { clearKnowledgeCache } from '@/lib/knowledge-search';

type Suggestion = {
  id: string;
  questionExample: string;
  frequency: number;
  suggestedTitle: string;
  suggestedAnswer: string;
  suggestedCategory: string;
};

function pickCategory(text: string): string {
  if (/(退款|退貨|換貨|return|refund)/i.test(text)) return '退換貨政策';
  if (/(運費|物流|配送|shipping|delivery)/i.test(text)) return '物流配送';
  if (/(價格|方案|費用|price|plan)/i.test(text)) return '價格方案';
  if (/(帳號|登入|註冊|account|login)/i.test(text)) return '帳號設定';
  return '常見問題';
}

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

    const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: contacts } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contacts ?? []).map((c) => c.id);
    if (contactIds.length === 0) return NextResponse.json({ suggestions: [] });

    const { data: assistantRows } = await supabase
      .from('conversations')
      .select('id, contact_id, created_at, status, is_resolved')
      .eq('role', 'assistant')
      .in('contact_id', contactIds)
      .gte('created_at', since.toISOString())
      .or('status.eq.needs_human,is_resolved.eq.false')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!assistantRows?.length) return NextResponse.json({ suggestions: [] });

    const allContactIds = [...new Set(assistantRows.map((r) => r.contact_id))];
    const { data: userMessages } = await supabase
      .from('conversations')
      .select('contact_id, message, created_at')
      .eq('role', 'user')
      .in('contact_id', allContactIds)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    const userMsgsByContact = new Map<string, { message: string; created_at: string }[]>();
    for (const m of userMessages ?? []) {
      const arr = userMsgsByContact.get(m.contact_id) ?? [];
      arr.push({ message: m.message, created_at: m.created_at });
      userMsgsByContact.set(m.contact_id, arr);
    }

    const grouped = new Map<string, { count: number; question: string }>();
    for (const row of assistantRows) {
      const msgs = userMsgsByContact.get(row.contact_id) ?? [];
      const prev = msgs.find((m) => m.created_at < row.created_at);

      const question = (prev?.message ?? '').trim();
      if (!question) continue;
      const key = question.toLowerCase().slice(0, 80);
      const current = grouped.get(key);
      if (current) current.count += 1;
      else grouped.set(key, { count: 1, question });
    }

    const suggestions: Suggestion[] = Array.from(grouped.entries())
      .map(([key, value], idx) => ({
        id: `${idx + 1}-${Buffer.from(key).toString('base64').slice(0, 8)}`,
        questionExample: value.question,
        frequency: value.count,
        suggestedTitle: value.question.slice(0, 36),
        suggestedAnswer: `建議補充此問題的標準回覆流程：\n1) 先確認客戶需求與必要資訊\n2) 提供明確可執行步驟\n3) 如需人工處理，說明轉接條件與預估時間`,
        suggestedCategory: pickCategory(value.question),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('GET /api/knowledge-base/gap-analysis error:', e);
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

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim().slice(0, 50) : 'general';
    if (!title) return NextResponse.json({ error: '標題為必填' }, { status: 400 });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: user.id,
        title,
        content,
        category,
        is_active: true,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await clearKnowledgeCache(user.id);
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (e) {
    console.error('POST /api/knowledge-base/gap-analysis error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

