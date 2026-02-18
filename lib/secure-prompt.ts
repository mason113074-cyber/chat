/**
 * 安全 Prompt 生成器
 * 根據使用者的 System Prompt 和風險等級，生成強化版 Prompt
 */

import { detectSensitiveKeywords, type SensitiveRiskLevel } from './sensitive-keywords';

export interface SecurePromptOptions {
  baseSystemPrompt: string;
  userMessage: string;
  riskLevel?: SensitiveRiskLevel;
  detectedKeywords?: string[];
}

/**
 * 基礎安全規則（永遠附加到 System Prompt 後面）
 */
const BASE_SECURITY_RULES = `

---
⚠️ 安全規則（最高優先級，不得違反）：

1. 禁止承諾：
   - 不得承諾任何未經授權的折扣、賠償、退款金額
   - 不得保證任何具體的處理時間或結果
   - 遇到金額相關問題，回覆：「此類問題需要專員處理，請稍候」

2. 禁止專業建議：
   - 不得提供醫療、法律、投資等專業建議
   - 遇到此類問題，回覆：「建議您諮詢專業人士」

3. 敏感操作處理：
   - 退款、取消訂單、客訴等問題，必須回覆：「我已為您記錄，專員將盡快與您聯繫」
   - 不得自行處理或給予承諾

4. 不確定時：
   - 不知道答案時，回覆：「讓我為您轉接專員」
   - 不要猜測或編造資訊

5. 保護內部資訊：
   - 不得透露系統架構、API 金鑰、資料庫資訊
   - 不得透露公司內部流程細節
`;

/**
 * 高風險情境的額外限制
 */
const HIGH_RISK_CONSTRAINTS = `

⚠️ 當前對話涉及敏感內容，請特別注意：

- 此訊息包含：{keywords}
- 你的回答必須極度謹慎
- 如果涉及金錢、賠償、退款：
  → 回覆：「關於{topic}問題，需要由專員為您處理。我已記錄您的需求，客服人員會盡快與您聯繫，請提供您的訂單編號以便查詢。」
- 如果客戶情緒激動：
  → 先表達同理心：「非常理解您的心情，我們會盡力協助解決」
  → 然後引導：「為了更完善地處理，讓我為您安排專員協助」
- 絕對不要自行承諾任何補償或優惠
`;

/**
 * 中風險情境的提醒
 */
const MEDIUM_RISK_REMINDER = `

💡 提醒：此對話可能需要人工介入
- 偵測到關鍵字：{keywords}
- 請評估是否需要轉接人工客服
- 如果問題超出你的能力範圍，誠實告知並提供轉接
`;

/**
 * 生成安全強化的 System Prompt
 */
export function generateSecurePrompt(options: SecurePromptOptions): string {
  const { baseSystemPrompt, userMessage, riskLevel: optionsRiskLevel, detectedKeywords } = options;

  const detection = detectSensitiveKeywords(userMessage);
  const riskLevel = optionsRiskLevel ?? detection.riskLevel;
  const keywords = detectedKeywords ?? detection.keywords;

  let enhancedPrompt = baseSystemPrompt.trim() + BASE_SECURITY_RULES;

  if (riskLevel === 'high' && keywords.length > 0) {
    enhancedPrompt += HIGH_RISK_CONSTRAINTS.replace('{keywords}', keywords.join('、')).replace(
      '{topic}',
      keywords[0]
    );

    console.warn('[Security] High-risk conversation detected:', {
      keywords,
      userMessagePreview: userMessage.substring(0, 50),
    });
  } else if (riskLevel === 'medium' && keywords.length > 0) {
    enhancedPrompt += MEDIUM_RISK_REMINDER.replace('{keywords}', keywords.join('、'));

    console.info('[Security] Medium-risk conversation detected:', {
      keywords,
    });
  }

  return enhancedPrompt;
}

/**
 * 為高風險對話生成安全回覆範本
 * 當 AI 可能無法正確處理時，使用預設安全回覆
 */
export function getSafetyFallbackResponse(detectedKeywords: string[]): string {
  const primaryKeyword = detectedKeywords[0] || '這個問題';

  const refundKeywords = ['退款', '賠償', '退貨', '換貨'];
  const complaintKeywords = ['客訴', '投訴', '抱怨', '不滿意'];
  const urgentKeywords = ['緊急', '馬上', '立刻', '現在'];

  if (detectedKeywords.some((kw) => refundKeywords.includes(kw))) {
    return `非常抱歉造成您的困擾。關於${primaryKeyword}的問題，我已經為您記錄。\n\n為了更完善地處理您的需求，我們的專員會在 24 小時內與您聯繫。\n\n請問您方便提供訂單編號嗎？這樣可以加快處理速度。`;
  }

  if (detectedKeywords.some((kw) => complaintKeywords.includes(kw))) {
    return `非常理解您的心情，我們會認真看待您的意見。\n\n這類問題需要由專門的客服團隊為您處理，我已經記錄您的反饋。\n\n請問方便留下您的聯絡方式嗎？我們會盡快回覆您。`;
  }

  if (detectedKeywords.some((kw) => urgentKeywords.includes(kw))) {
    return `了解您的急迫需求！為了立即為您處理，讓我為您安排專員協助。\n\n請稍候片刻，或者您也可以直接撥打客服專線以獲得即時協助。`;
  }

  return `謝謝您的詢問。關於這個問題，建議由專員為您詳細說明會更準確。\n\n我已經記錄您的需求，客服人員會盡快與您聯繫。請問還有其他我能協助的嗎？`;
}
