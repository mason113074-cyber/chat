import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchKnowledgeForUser } from '@/lib/knowledge';

/**
 * For AI use: returns relevant knowledge text for the given query (user message).
 * Used by chat and webhook to enrich system prompt.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const q = request.nextUrl.searchParams.get('q') ?? '';
    const text = await searchKnowledgeForUser(user.id, q, 3, 2000);
    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
