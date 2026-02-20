/**
 * Plan limits by slug. Used by billing usage API and usage checks (chat, webhook).
 * -1 = unlimited.
 * Slugs: free, starter, pro, business (basic/enterprise kept as alias).
 */
export const PLAN_LIMITS = {
  free: { monthly_conversations: 100, knowledge_entries: 50 },
  starter: { monthly_conversations: 1000, knowledge_entries: 200 },
  basic: { monthly_conversations: 1000, knowledge_entries: 200 }, // alias
  pro: { monthly_conversations: 5000, knowledge_entries: 1000 },
  business: { monthly_conversations: 20000, knowledge_entries: 5000 },
  enterprise: { monthly_conversations: 20000, knowledge_entries: 5000 }, // alias
} as const;

export type PlanSlug = keyof typeof PLAN_LIMITS;

export function getConversationLimit(slug: string): number {
  const key = slug in PLAN_LIMITS ? (slug as PlanSlug) : 'free';
  return PLAN_LIMITS[key].monthly_conversations;
}

export function getKnowledgeLimit(slug: string): number {
  const key = slug in PLAN_LIMITS ? (slug as PlanSlug) : 'free';
  return PLAN_LIMITS[key].knowledge_entries;
}

const PLAN_ORDER: PlanSlug[] = ['free', 'starter', 'pro', 'business'];

export function getNextPlanSlug(currentSlug: string): string | null {
  const normalized =
    currentSlug === 'basic' ? 'starter' : currentSlug === 'enterprise' ? 'business' : currentSlug;
  const i = PLAN_ORDER.indexOf(normalized as PlanSlug);
  if (i < 0 || i >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[i + 1];
}
