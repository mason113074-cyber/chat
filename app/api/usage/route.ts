import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FREE_PLAN_LIMIT = 100;

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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    let used = 0;
    if (contactIds.length > 0) {
      const { count, error } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', startOfMonth);
      if (!error && count != null) used = count;
    }

    let limit = FREE_PLAN_LIMIT;
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub?.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('limits')
        .eq('id', sub.plan_id)
        .single();
      const maxReplies = (plan?.limits as Record<string, unknown>)?.max_replies_monthly;
      if (typeof maxReplies === 'number' && maxReplies >= 0) limit = maxReplies;
      else if (typeof maxReplies === 'number' && maxReplies === -1) limit = Number.MAX_SAFE_INTEGER;
    }

    return NextResponse.json({ used, limit });
  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
