import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id, created_at')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    const iso = (d: Date) => d.toISOString();

    let thisMonthTotal = 0;
    let thisMonthAssistant = 0;
    let lastMonthTotal = 0;
    let lastMonthAssistant = 0;
    let thisMonthNewContacts = 0;
    let lastMonthNewContacts = 0;

    if (contactIds.length > 0) {
      const [thisConv, lastConv, thisAssist, lastAssist] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('contact_id', contactIds).gte('created_at', iso(thisStart)).lte('created_at', iso(thisEnd)),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('contact_id', contactIds).gte('created_at', iso(lastStart)).lte('created_at', iso(lastEnd)),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('contact_id', contactIds).eq('role', 'assistant').gte('created_at', iso(thisStart)).lte('created_at', iso(thisEnd)),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('contact_id', contactIds).eq('role', 'assistant').gte('created_at', iso(lastStart)).lte('created_at', iso(lastEnd)),
      ]);
      thisMonthTotal = thisConv.count ?? 0;
      lastMonthTotal = lastConv.count ?? 0;
      thisMonthAssistant = thisAssist.count ?? 0;
      lastMonthAssistant = lastAssist.count ?? 0;
    }

    for (const c of contactRows ?? []) {
      const t = c.created_at ? new Date(c.created_at).getTime() : 0;
      if (t >= thisStart.getTime() && t <= thisEnd.getTime()) thisMonthNewContacts++;
      if (t >= lastStart.getTime() && t <= lastEnd.getTime()) lastMonthNewContacts++;
    }

    let avgReplySeconds: number | null = null;
    let lastMonthAvgReplySeconds: number | null = null;
    if (contactIds.length > 0) {
      const [thisRows, lastRows] = await Promise.all([
        supabase.from('conversations').select('contact_id, role, created_at').in('contact_id', contactIds).gte('created_at', iso(thisStart)).lte('created_at', iso(thisEnd)).order('contact_id').order('created_at', { ascending: true }),
        supabase.from('conversations').select('contact_id, role, created_at').in('contact_id', contactIds).gte('created_at', iso(lastStart)).lte('created_at', iso(lastEnd)).order('contact_id').order('created_at', { ascending: true }),
      ]);
      const toPairs = (rows: { contact_id: string; role: string; created_at: string }[]) => {
        const pairs: number[] = [];
        for (let i = 0; i < rows.length - 1; i++) {
          const cur = rows[i];
          const next = rows[i + 1];
          if (cur.role === 'user' && next.role === 'assistant' && cur.contact_id === next.contact_id) {
            const diff = new Date(next.created_at).getTime() - new Date(cur.created_at).getTime();
            if (diff >= 0) pairs.push(diff / 1000);
          }
        }
        return pairs.length > 0 ? pairs.reduce((a, b) => a + b, 0) / pairs.length : null;
      };
      avgReplySeconds = toPairs(thisRows.data ?? []);
      lastMonthAvgReplySeconds = toPairs(lastRows.data ?? []);
    }

    const pct = (curr: number, prev: number) => (prev === 0 ? (curr === 0 ? 0 : 100) : Math.round(((curr - prev) / prev) * 100));
    const avgReplyChange =
      avgReplySeconds != null && lastMonthAvgReplySeconds != null && lastMonthAvgReplySeconds > 0
        ? Math.round(((avgReplySeconds - lastMonthAvgReplySeconds) / lastMonthAvgReplySeconds) * 100)
        : null;

    return NextResponse.json({
      thisMonth: {
        totalConversations: thisMonthTotal,
        aiReplies: thisMonthAssistant,
        newContacts: thisMonthNewContacts,
        avgReplySeconds: avgReplySeconds != null ? Math.round(avgReplySeconds) : null,
      },
      lastMonth: {
        totalConversations: lastMonthTotal,
        aiReplies: lastMonthAssistant,
        newContacts: lastMonthNewContacts,
      },
      change: {
        totalConversations: pct(thisMonthTotal, lastMonthTotal),
        aiReplies: pct(thisMonthAssistant, lastMonthAssistant),
        newContacts: pct(thisMonthNewContacts, lastMonthNewContacts),
        avgReplySeconds: avgReplyChange,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
