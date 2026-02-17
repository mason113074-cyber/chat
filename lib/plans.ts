/**
 * Plan limits by slug. Used by billing usage API and usage checks (chat, webhook).
 * -1 = unlimited.
 */
export const PLAN_LIMITS = {
  free: { monthly_conversations: 50, knowledge_entries: 10 },
  basic: { monthly_conversations: 500, knowledge_entries: 100 },
  pro: { monthly_conversations: 5000, knowledge_entries: 500 },
  enterprise: { monthly_conversations: -1, knowledge_entries: -1 },
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

const PLAN_ORDER: PlanSlug[] = ['free', 'basic', 'pro', 'enterprise'];

export function getNextPlanSlug(currentSlug: string): string | null {
  const i = PLAN_ORDER.indexOf(currentSlug as PlanSlug);
  if (i < 0 || i >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[i + 1];
}
