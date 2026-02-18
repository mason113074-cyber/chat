import { getSupabaseAdmin } from './supabase';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // 美金
}

// GPT-4o-mini 定價（2026）
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000, // $0.15 per 1M input tokens
    output: 0.6 / 1_000_000, // $0.60 per 1M output tokens
  },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = promptTokens * pricing.input;
  const outputCost = completionTokens * pricing.output;
  return inputCost + outputCost;
}

export async function trackTokenUsage(userId: string, usage: TokenUsage): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from('openai_usage').insert({
      user_id: userId,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      cost_usd: usage.cost,
      created_at: new Date().toISOString(),
    });

    console.log(
      `[Token Usage] User ${userId}: ${usage.totalTokens} tokens, $${usage.cost.toFixed(4)}`
    );
  } catch (error) {
    console.error('[Token Usage] Failed to track:', error);
    // 不要因為記錄失敗而影響主流程
  }
}

const DEFAULT_MONTHLY_BUDGET =
  Math.max(0, parseFloat(process.env.OPENAI_MONTHLY_BUDGET ?? '100') || 100);

export async function checkTokenBudget(
  userId: string,
  monthlyBudget: number = DEFAULT_MONTHLY_BUDGET
): Promise<{ withinBudget: boolean; used: number; remaining: number }> {
  const supabase = getSupabaseAdmin();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('openai_usage')
    .select('cost_usd')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('[Token Budget] Check failed:', error);
    return { withinBudget: true, used: 0, remaining: monthlyBudget };
  }

  const used = data?.reduce((sum, row) => sum + (row.cost_usd ?? 0), 0) ?? 0;
  const remaining = Math.max(0, monthlyBudget - used);

  return {
    withinBudget: used < monthlyBudget,
    used,
    remaining,
  };
}
