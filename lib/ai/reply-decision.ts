import type { SensitiveKeywordDetectionResult } from '@/lib/security/sensitive-keywords';

export type ReplyDecisionAction = 'AUTO' | 'SUGGEST' | 'ASK' | 'HANDOFF';

export type ReplyDecisionCategory =
  | 'refund'
  | 'return_exchange'
  | 'discount'
  | 'payment'
  | 'invoice'
  | 'shipping'
  | 'delivery'
  | 'warranty'
  | 'complaint'
  | 'price'
  | 'general';

export interface ReplyDecisionSource {
  id: string;
  title: string;
  category?: string | null;
}

export interface ReplyDecisionSettings {
  confidence_threshold?: number | null;
}

export interface ReplyDecisionInput {
  userMessage: string;
  userId: string;
  contactId: string;
  sourcesCount: number;
  riskDetection: SensitiveKeywordDetectionResult;
  settings: ReplyDecisionSettings;
  sources?: ReplyDecisionSource[];
  candidateDraft?: string;
}

export interface ReplyDecisionResult {
  action: ReplyDecisionAction;
  draftText: string;
  askText?: string;
  reason: string;
  confidence: number;
  category: ReplyDecisionCategory;
  sources: {
    count: number;
    hit: boolean;
    titles: string[];
  };
}

const HIGH_RISK_CATEGORIES = new Set<ReplyDecisionCategory>([
  'refund',
  'discount',
  'price',
  'shipping',
  'delivery',
  'complaint',
]);

const TEMPLATE_PRIORITY_CATEGORIES = new Set<ReplyDecisionCategory>([
  'refund',
  'return_exchange',
  'discount',
  'payment',
  'invoice',
  'shipping',
  'delivery',
  'warranty',
  'complaint',
]);

const CATEGORY_PATTERNS: Array<{ category: ReplyDecisionCategory; regex: RegExp }> = [
  { category: 'refund', regex: /(退款|退錢|賠償|取消訂單|取消交易)/i },
  { category: 'return_exchange', regex: /(退貨|換貨|退換貨)/i },
  { category: 'discount', regex: /(折扣|打折|優惠|折價|折數|coupon|優惠碼)/i },
  { category: 'payment', regex: /(付款|付費|匯款|轉帳|刷卡|支付|payment)/i },
  { category: 'invoice', regex: /(發票|統編|電子發票|紙本發票)/i },
  { category: 'delivery', regex: /(到貨|何時到|幾天到|送達|到貨日|何時送到)/i },
  { category: 'shipping', regex: /(運費|運送|物流|配送|寄送|宅配|shipping)/i },
  { category: 'warranty', regex: /(保固|維修|故障|瑕疵)/i },
  { category: 'complaint', regex: /(客訴|投訴|申訴|抱怨|不滿意|態度差)/i },
  { category: 'price', regex: /(價格|價錢|報價|費用|多少錢)/i },
];

const SIMPLE_MESSAGE_PATTERN = /^(你好|哈囉|嗨|hi|hello|感謝|謝謝|thanks|ok|好的|收到|在嗎|有人嗎)[!！。. ]*$/i;
const ORDER_NUMBER_PATTERN =
  /((訂單|order)\s*[#:：-]?\s*[a-z0-9-]{4,}|#[a-z0-9-]{4,}|\b[a-z]{0,2}\d{6,}\b)/i;
const PRODUCT_PATTERN = /(商品|產品|品項|型號|款式|名稱|sku)/i;
const DATE_PATTERN = /(\d{4}[\/\-年]\d{1,2}[\/\-月]\d{1,2}日?|\d{1,2}[\/\-月]\d{1,2}日?|今天|昨日|昨天|前天|上週|上個月)/i;
const DETAILS_PATTERN = /(問題|狀況|情況|原因|內容|照片|截圖|描述)/i;

const DEFAULT_SAFE_DRAFT = '已收到您的問題，我們會由專員確認後盡快回覆您。';
const DEFAULT_HANDOFF_TEXT = '此問題需要專員協助處理，我們已為您轉交人工客服，請稍候。';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeMessage(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function classifyReplyCategory(userMessage: string): ReplyDecisionCategory {
  for (const rule of CATEGORY_PATTERNS) {
    if (rule.regex.test(userMessage)) {
      return rule.category;
    }
  }
  return 'general';
}

function isSimpleMessage(userMessage: string): boolean {
  const message = normalizeMessage(userMessage);
  if (!message) return true;
  if (SIMPLE_MESSAGE_PATTERN.test(message)) return true;
  return message.length <= 8;
}

function buildClarifyingQuestions(
  category: ReplyDecisionCategory,
  userMessage: string
): string[] {
  const questions: string[] = [];
  const hasOrderNumber = ORDER_NUMBER_PATTERN.test(userMessage);
  const hasProduct = PRODUCT_PATTERN.test(userMessage);
  const hasDate = DATE_PATTERN.test(userMessage);
  const hasDetails = DETAILS_PATTERN.test(userMessage);

  if (category === 'refund' || category === 'return_exchange') {
    if (!hasOrderNumber) questions.push('請提供訂單編號，方便我們先查核訂單狀態。');
    if (!hasProduct) questions.push('請告知欲退款/退換貨的商品名稱與規格。');
    if (!hasDate) questions.push('請提供下單日期或付款日期。');
  } else if (category === 'discount' || category === 'price') {
    if (!hasProduct) questions.push('請問您要詢問哪一個商品或方案的價格/折扣呢？');
    if (!hasDetails) questions.push('請提供數量或方案需求，方便我們確認適用優惠。');
  } else if (category === 'payment') {
    if (!hasOrderNumber) questions.push('請提供訂單編號。');
    if (!hasDetails) questions.push('請說明付款方式與遇到的問題（例如刷卡失敗、轉帳未入帳）。');
  } else if (category === 'invoice') {
    if (!hasOrderNumber) questions.push('請提供訂單編號。');
    questions.push('請問您需要電子發票、紙本發票，或統編發票？');
  } else if (category === 'shipping' || category === 'delivery') {
    if (!hasOrderNumber) questions.push('請提供訂單編號，方便我們查詢配送進度。');
    if (!hasProduct) questions.push('請告知商品名稱或品項。');
  } else if (category === 'warranty') {
    if (!hasProduct) questions.push('請提供商品名稱或型號。');
    if (!hasDate) questions.push('請提供購買日期。');
    if (!hasDetails) questions.push('請簡述故障情況，若可附上照片更好。');
  } else if (category === 'complaint') {
    if (!hasOrderNumber) questions.push('請提供訂單編號（若有）。');
    if (!hasDetails) questions.push('請描述您遇到的問題與發生時間。');
  }

  return questions.slice(0, 3);
}

function formatAskText(questions: string[]): string {
  if (questions.length === 0) {
    return '為了正確協助您，請再提供訂單編號、商品名稱與相關時間資訊。';
  }
  return `為了更快協助您，請先補充以下資訊：\n${questions
    .map((q, idx) => `${idx + 1}. ${q}`)
    .join('\n')}`;
}

function calculateHeuristicConfidence(params: {
  category: ReplyDecisionCategory;
  riskDetection: SensitiveKeywordDetectionResult;
  sourcesCount: number;
  simpleMessage: boolean;
  missingRequiredFields: boolean;
}): number {
  let score = 0.4;

  if (params.sourcesCount > 0) {
    score += Math.min(0.4, params.sourcesCount * 0.15);
  } else {
    score -= 0.25;
  }

  if (params.riskDetection.riskLevel === 'high') score -= 0.35;
  if (params.riskDetection.riskLevel === 'medium') score -= 0.15;
  if (HIGH_RISK_CATEGORIES.has(params.category)) score -= 0.25;
  if (params.simpleMessage) score += 0.05;
  if (params.missingRequiredFields) score -= 0.2;

  return clamp(Number(score.toFixed(2)), 0, 1);
}

export function decideReplyAction(input: ReplyDecisionInput): ReplyDecisionResult {
  const category = classifyReplyCategory(input.userMessage);
  const sourcesCount = Math.max(0, Math.floor(input.sourcesCount));
  const simpleMessage = isSimpleMessage(input.userMessage);
  const threshold = clamp(Number(input.settings.confidence_threshold ?? 0.6), 0, 1);
  const clarifyingQuestions = TEMPLATE_PRIORITY_CATEGORIES.has(category)
    ? buildClarifyingQuestions(category, input.userMessage)
    : [];
  const missingRequiredFields = clarifyingQuestions.length > 0;

  const confidence = calculateHeuristicConfidence({
    category,
    riskDetection: input.riskDetection,
    sourcesCount,
    simpleMessage,
    missingRequiredFields,
  });

  const highRiskCategory = HIGH_RISK_CATEGORIES.has(category);
  const highRiskDetected = highRiskCategory || input.riskDetection.riskLevel === 'high';
  const sourceSummary = {
    count: sourcesCount,
    hit: sourcesCount > 0,
    titles: (input.sources ?? []).slice(0, 5).map((s) => s.title),
  };
  const candidateDraft = input.candidateDraft?.trim() || DEFAULT_SAFE_DRAFT;

  if (highRiskDetected && missingRequiredFields) {
    const askText = formatAskText(clarifyingQuestions);
    return {
      action: 'ASK',
      draftText: askText,
      askText,
      reason: '高風險模板缺少必要欄位，需先澄清資訊。',
      confidence,
      category,
      sources: sourceSummary,
    };
  }

  if (sourcesCount === 0) {
    if (!simpleMessage) {
      const askText = highRiskDetected
        ? '為避免提供錯誤承諾，此問題將轉交專員協助處理。'
        : '目前沒有足夠依據可直接回答，請提供訂單編號、商品名稱與相關日期。';
      return {
        action: highRiskDetected ? 'HANDOFF' : 'ASK',
        draftText: askText,
        askText: highRiskDetected ? undefined : askText,
        reason: '無知識庫命中，避免編造內容。',
        confidence,
        category,
        sources: sourceSummary,
      };
    }

    const askText = '請問您想了解哪一項資訊？若有訂單編號也請一併提供，方便我們快速協助。';
    return {
      action: 'ASK',
      draftText: askText,
      askText,
      reason: '無知識庫命中，先蒐集必要資訊。',
      confidence,
      category,
      sources: sourceSummary,
    };
  }

  if (confidence < threshold) {
    if (missingRequiredFields) {
      const askText = formatAskText(clarifyingQuestions);
      return {
        action: 'ASK',
        draftText: askText,
        askText,
        reason: '信心不足且資訊不完整，需先提問澄清。',
        confidence,
        category,
        sources: sourceSummary,
      };
    }

    return {
      action: 'SUGGEST',
      draftText: candidateDraft,
      reason: '信心值低於門檻，改為人工確認後送出。',
      confidence,
      category,
      sources: sourceSummary,
    };
  }

  if (highRiskDetected) {
    return {
      action: 'SUGGEST',
      draftText: candidateDraft,
      reason: '高風險類別禁止 AUTO，需人工審核。',
      confidence,
      category,
      sources: sourceSummary,
    };
  }

  return {
    action: 'AUTO',
    draftText: candidateDraft,
    reason: '低風險且有知識庫依據，符合 AUTO 條件。',
    confidence,
    category,
    sources: sourceSummary,
  };
}

export function getDefaultHandoffText(): string {
  return DEFAULT_HANDOFF_TEXT;
}
