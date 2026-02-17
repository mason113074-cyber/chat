import type { SupabaseClient } from '@supabase/supabase-js';
import { getConversationLimit } from '@/lib/plans';

/**
 * Returns plan slug, conversation limit, and monthly (current month) assistant message count for the user.
 * Used by chat and webhook to enforce usage limits.
 */
export async function getConversationUsageForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ planSlug: string; limit: number; used: number }> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let planSlug = 'free';
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id, plan:plans(slug)')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planRow = sub as { plan?: { slug?: string } } | null;
  if (planRow?.plan?.slug) planSlug = planRow.plan.slug;

  const limit = getConversationLimit(planSlug);

  const { data: contactRows } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId);
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

  return { planSlug, limit, used };
}
