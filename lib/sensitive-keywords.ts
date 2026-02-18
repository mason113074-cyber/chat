/**
 * 敏感關鍵字設定
 * 用於前置檢查和輸出過濾
 */

// 高風險關鍵字（涉及金錢、法律責任）
export const HIGH_RISK_KEYWORDS = [
  // 金錢相關
  '退款', '賠償', '折扣', '免費', '贈送', '送你', '給你',
  '打折', '優惠', '現金', '匯款', '轉帳',

  // 訂單相關
  '取消訂單', '退貨', '退換貨', '換貨',

  // 法律責任
  '法律責任', '賠償金', '損害賠償', '訴訟',

  // 承諾類
  '保證', '一定會', '絕對', '承諾',
] as const;

// 中風險關鍵字（需要人工確認）
export const MEDIUM_RISK_KEYWORDS = [
  '客訴', '投訴', '申訴', '抱怨',
  '不滿意', '很生氣', '態度差',
  '找老闆', '找主管', '要人工',
  '轉接', '專員', '客服',
] as const;

// 禁止提供的建議類型
export const FORBIDDEN_TOPICS = [
  // 專業建議
  '醫療', '治療', '藥物', '診斷', '疾病',
  '法律', '訴訟', '律師', '官司',
  '投資', '理財', '股票', '基金',

  // 敏感操作
  '密碼', 'password', '帳號',
  '信用卡', '卡號', '身分證',
] as const;

// 內部資訊洩漏風險
export const INTERNAL_KEYWORDS = [
  'openai', 'api key', 'secret', 'token',
  'database', '資料庫', '內部文件',
  'supabase', 'vercel', '環境變數',
] as const;

export type SensitiveRiskLevel = 'high' | 'medium' | 'low';

export interface SensitiveKeywordDetectionResult {
  hasKeyword: boolean;
  keywords: string[];
  riskLevel: SensitiveRiskLevel;
}

export interface DetectSensitiveKeywordsOptions {
  includeInternal?: boolean;
}

/**
 * 檢查文字是否包含敏感關鍵字
 */
export function detectSensitiveKeywords(
  text: string,
  options: DetectSensitiveKeywordsOptions = {}
): SensitiveKeywordDetectionResult {
  const normalizedText = text.toLowerCase();

  // 檢查高風險關鍵字
  const highRiskFound = HIGH_RISK_KEYWORDS.filter((kw) =>
    normalizedText.includes(kw.toLowerCase())
  );

  // 檢查中風險關鍵字
  const mediumRiskFound = MEDIUM_RISK_KEYWORDS.filter((kw) =>
    normalizedText.includes(kw.toLowerCase())
  );

  // 檢查禁止話題
  const forbiddenFound = FORBIDDEN_TOPICS.filter((kw) =>
    normalizedText.includes(kw.toLowerCase())
  );

  // 檢查內部資訊（通常用於輸出過濾）
  const internalFound = options.includeInternal
    ? INTERNAL_KEYWORDS.filter((kw) => normalizedText.includes(kw.toLowerCase()))
    : [];

  const foundKeywords = Array.from(
    new Set([...highRiskFound, ...mediumRiskFound, ...forbiddenFound, ...internalFound])
  );

  let riskLevel: SensitiveRiskLevel = 'low';
  if (highRiskFound.length > 0 || forbiddenFound.length > 0 || internalFound.length > 0) {
    riskLevel = 'high';
  } else if (mediumRiskFound.length > 0) {
    riskLevel = 'medium';
  }

  return {
    hasKeyword: foundKeywords.length > 0,
    keywords: foundKeywords,
    riskLevel,
  };
}
