import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const { data: contactRows } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    let avgReplyLength: number | null = null;
    let aiModel: string | null = null;

    if (contactIds.length > 0) {
      const { data: assistRows } = await supabase
        .from('conversations')
        .select('message')
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (assistRows && assistRows.length > 0) {
        const totalLen = assistRows.reduce((acc, r) => acc + (r.message?.length ?? 0), 0);
        avgReplyLength = Math.round(totalLen / assistRows.length);
      }
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('ai_model')
      .eq('id', user.id)
      .maybeSingle();
    aiModel = userRow?.ai_model ?? null;

    return NextResponse.json({ avgReplyLength, aiModel });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
