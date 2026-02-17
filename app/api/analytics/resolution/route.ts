import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';

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

    const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);
    const contactMap = new Map((contactRows ?? []).map((c) => [c.id, c]));

    if (contactIds.length === 0) {
      return NextResponse.json({
        total_conversations: 0,
        ai_resolved: 0,
        needs_human: 0,
        resolution_rate: 0,
        unresolved_questions: [],
      });
    }

    const isoStart = start.toISOString();
    const isoEnd = end.toISOString();

    const { data: assistantRows } = await supabase
      .from('conversations')
      .select('id, contact_id, created_at, status, is_resolved')
      .in('contact_id', contactIds)
      .eq('role', 'assistant')
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const total_conversations = assistantRows?.length ?? 0;
    let ai_resolved = 0;
    let needs_human = 0;
    const unresolvedList: { id: string; contact_id: string; created_at: string; status: string }[] = [];

    for (const r of assistantRows ?? []) {
      const resolved = r.is_resolved === true;
      const needHuman = r.status === 'needs_human' || r.is_resolved === false;
      if (resolved) ai_resolved++;
      if (needHuman) {
        needs_human++;
        unresolvedList.push({
          id: r.id,
          contact_id: r.contact_id,
          created_at: r.created_at,
          status: r.status ?? 'needs_human',
        });
      }
    }

    unresolvedList.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    const topUnresolved = unresolvedList.slice(0, 20);

    const contactIdsForUserMsg = [...new Set(topUnresolved.map((u) => u.contact_id))];
    const { data: userMessages } = await supabase
      .from('conversations')
      .select('contact_id, message, created_at')
      .in('contact_id', contactIdsForUserMsg)
      .eq('role', 'user')
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const getLastUserMessage = (contactId: string, beforeTime: string) => {
      const list = (userMessages ?? []).filter(
        (m) => m.contact_id === contactId && m.created_at < beforeTime
      );
      if (list.length === 0) return null;
      list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      return list[0];
    };

    const unresolved_questions = topUnresolved.map((u) => {
      const contact = contactMap.get(u.contact_id);
      const lastUser = getLastUserMessage(u.contact_id, u.created_at);
      return {
        id: u.id,
        contact_id: u.contact_id,
        contact_name: contact?.name ?? '—',
        last_message: lastUser?.message?.slice(0, 80) ?? '—',
        created_at: u.created_at,
        status: u.status,
      };
    });

    const resolution_rate =
      total_conversations > 0 ? Math.round((ai_resolved / total_conversations) * 100) : 0;

    return NextResponse.json({
      total_conversations,
      ai_resolved,
      needs_human,
      resolution_rate,
      unresolved_questions,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
