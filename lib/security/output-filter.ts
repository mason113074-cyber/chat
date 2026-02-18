/**
 * AI 輸出過濾器
 * 檢查 AI 回答是否包含不安全內容
 */

import { INTERNAL_KEYWORDS } from './sensitive-keywords';

export interface FilterResult {
  isSafe: boolean;
  reason?: string;
  originalResponse: string;
  filteredResponse: string;
}

/**
 * 過濾 AI 回答，確保不包含危險內容
 */
export async function filterAIOutput(aiResponse: string): Promise<FilterResult> {
  const normalizedResponse = aiResponse.toLowerCase();

  // 1. 檢查是否洩漏內部資訊
  const internalKeywordFound = INTERNAL_KEYWORDS.find((kw) =>
    normalizedResponse.includes(kw.toLowerCase())
  );

  if (internalKeywordFound) {
    console.warn('[Security] Internal information detected in AI response:', {
      keyword: internalKeywordFound,
      responsePreview: aiResponse.substring(0, 100),
    });

    return {
      isSafe: false,
      reason: `內部資訊洩漏風險：${internalKeywordFound}`,
      originalResponse: aiResponse,
      filteredResponse: '抱歉，系統發生錯誤，請稍後再試或聯繫客服人員。',
    };
  }

  // 2. 檢查是否承諾金額賠償
  const amountPromisePatterns = [
    /(?:將|會)?退還.*[0-9,]+.*元/i,
    /賠償.*[0-9,]+.*元/i,
    /(?:免費)?贈送.*[0-9,]+.*元/i,
    /打.*折|[0-9]+折/i,
    /(?:給你|送你).*(?:優惠|折扣|現金)/i,
  ];

  const hasAmountPromise = amountPromisePatterns.some((pattern) =>
    pattern.test(aiResponse)
  );

  if (hasAmountPromise) {
    console.warn('[Security] Amount promise detected in AI response:', {
      responsePreview: aiResponse.substring(0, 100),
    });

    return {
      isSafe: false,
      reason: '承諾金額賠償',
      originalResponse: aiResponse,
      filteredResponse:
        '關於您的問題，我們需要專員為您詳細處理。請稍候，客服人員會盡快與您聯繫。',
    };
  }

  // 3. 檢查是否提供專業建議（醫療、法律、投資）
  const professionalAdvicePatterns = [
    /(?:建議你|你可以).*(?:服用|吃|用藥)/i,
    /(?:這是|應該是).*(?:疾病|症狀)/i,
    /法律上.*(?:你可以|建議)/i,
    /(?:買|投資).*(?:股票|基金|加密貨幣)/i,
  ];

  const hasProfessionalAdvice = professionalAdvicePatterns.some((pattern) =>
    pattern.test(aiResponse)
  );

  if (hasProfessionalAdvice) {
    console.warn('[Security] Professional advice detected in AI response');

    return {
      isSafe: false,
      reason: '提供專業建議',
      originalResponse: aiResponse,
      filteredResponse:
        '關於這類問題，建議您諮詢專業人士的意見。如果需要協助，請聯繫我們的客服團隊。',
    };
  }

  // 4. 檢查是否包含不當用語
  const inappropriatePatterns = [
    /(?:笨|傻|蠢|白痴|智障)/i,
    /(?:去死|滾|閉嘴)/i,
  ];

  const hasInappropriate = inappropriatePatterns.some((pattern) =>
    pattern.test(aiResponse)
  );

  if (hasInappropriate) {
    console.warn('[Security] Inappropriate language detected in AI response');

    return {
      isSafe: false,
      reason: '不當用語',
      originalResponse: aiResponse,
      filteredResponse:
        '抱歉，系統出現異常。請讓我重新為您服務，謝謝您的耐心。',
    };
  }

  // 5. 檢查長度異常（可能是錯誤或攻擊）
  if (aiResponse.length > 2000) {
    console.warn('[Security] Abnormally long response detected:', {
      length: aiResponse.length,
    });

    return {
      isSafe: false,
      reason: '回覆長度異常',
      originalResponse: aiResponse,
      filteredResponse:
        '抱歉，回覆內容過長。請讓我為您簡要說明，或者可以分次詢問。',
    };
  }

  // 6. 檢查是否為空回覆
  if (!aiResponse || aiResponse.trim().length < 3) {
    console.warn('[Security] Empty or too short response');

    return {
      isSafe: false,
      reason: '空回覆',
      originalResponse: aiResponse,
      filteredResponse:
        '抱歉，系統暫時無法回覆。請稍後再試，或直接聯繫客服人員。',
    };
  }

  // 通過所有檢查
  return {
    isSafe: true,
    originalResponse: aiResponse,
    filteredResponse: aiResponse,
  };
}

/**
 * 記錄過濾事件（用於監控和改進）
 */
export async function logFilterEvent(
  result: FilterResult,
  context: {
    userId?: string;
    contactId?: string;
    userMessage: string;
  }
): Promise<void> {
  if (!result.isSafe) {
    console.error('[Security] Filtered unsafe AI output:', {
      reason: result.reason,
      userId: context.userId,
      contactId: context.contactId,
      userMessagePreview: context.userMessage.substring(0, 50),
      responsePreview: result.originalResponse.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // TODO: 未來可以儲存到 Supabase 用於分析
    // await supabaseAdmin.from('security_logs').insert({ ... });
  }
}
