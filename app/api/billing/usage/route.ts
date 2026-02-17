import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConversationLimit, getKnowledgeLimit } from '@/lib/plans';

function getMonthRange(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const daysInMonth = end.getDate();
  const daysRemaining = Math.max(0, end.getDate() - now.getDate());
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    days_remaining: daysRemaining,
    startISO: start.toISOString(),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const { startISO } = getMonthRange(now);
    const period = getMonthRange(now);

    let planSlug = 'free';
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, plan:plans(slug)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const planRow = sub as { plan?: { slug?: string } } | null;
    if (planRow?.plan?.slug) planSlug = planRow.plan.slug;

    const convLimit = getConversationLimit(planSlug);
    const knowledgeLimit = getKnowledgeLimit(planSlug);

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    let conversationsUsed = 0;
    if (contactIds.length > 0) {
      const { count, error } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', startISO);
      if (!error && count != null) conversationsUsed = count;
    }

    const { count: knowledgeUsed, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const knowledgeCount = knowledgeError ? 0 : (knowledgeUsed ?? 0);

    const convPercentage = convLimit === -1 ? 0 : Math.min(100, Math.round((conversationsUsed / convLimit) * 100));
    const knowledgePercentage = knowledgeLimit === -1 ? 0 : Math.min(100, Math.round((knowledgeCount / knowledgeLimit) * 100));

    return NextResponse.json({
      plan: planSlug,
      conversations: {
        used: conversationsUsed,
        limit: convLimit,
        percentage: convPercentage,
      },
      knowledge: {
        used: knowledgeCount,
        limit: knowledgeLimit,
        percentage: knowledgePercentage,
      },
      billing_period: {
        start: period.start,
        end: period.end,
        days_remaining: period.days_remaining,
      },
    });
  } catch (error) {
    console.error('GET /api/billing/usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
