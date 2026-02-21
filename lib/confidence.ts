/** Sprint 6: 信心分數計算（基於知識庫匹配、模糊語句、guardrail 等） */
export interface ConfidenceResult {
  score: number;
  factors: {
    knowledgeMatch: boolean;
    containsHedging: boolean;
    replyLength: number;
    guardrailTriggered: boolean;
  };
}

const HEDGING_PATTERNS =
  /不確定|可能|也許|我猜|不太清楚|抱歉我無法|I'm not sure|maybe|perhaps|不太確定|難以判斷/i;

export function calculateConfidence(params: {
  knowledgeSourceCount: number;
  aiReply: string;
  guardrailTriggered: boolean;
}): ConfidenceResult {
  let score = 0.5;
  const containsHedging = HEDGING_PATTERNS.test(params.aiReply);

  if (params.knowledgeSourceCount > 0) score += 0.3;
  if (params.knowledgeSourceCount === 0) score -= 0.3;
  if (containsHedging) score -= 0.2;
  if (params.guardrailTriggered) score -= 0.3;
  if (params.aiReply.length < 20) score -= 0.1;

  return {
    score: Math.max(0, Math.min(1, score)),
    factors: {
      knowledgeMatch: params.knowledgeSourceCount > 0,
      containsHedging,
      replyLength: params.aiReply.length,
      guardrailTriggered: params.guardrailTriggered,
    },
  };
}
