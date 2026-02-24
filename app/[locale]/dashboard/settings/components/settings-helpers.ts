/** Helper functions for settings load/display (i18n defaults). Used by page.tsx only. */

export const ZH_QUICK_REPLY_SLOTS: [string[], string[], string[]] = [
  ['查詢訂單狀態', '你們的營業時間是幾點'],
  ['運費怎麼計算', '有什麼優惠活動嗎'],
  ['如何退換貨'],
];

export function isZhDefaultQuickReply(slotIndex: number, text: string): boolean {
  const trimmed = (text ?? '').trim();
  const variants = ZH_QUICK_REPLY_SLOTS[slotIndex];
  return variants.some((v) => trimmed.includes(v));
}

export const ZH_SYSTEM_PROMPT_PREFIXES = [
  '你是這位商家的專業客服',
  '你是一位親切友善的客服助理',
  '你是一位專業且友善的客服助理',
  '您好，我是專業客服顧問',
  '我是快速客服助理',
  '你是本商店的 AI 客服助理',
];

export function isZhDefaultSystemPrompt(prompt: string): boolean {
  const firstLine = prompt.trim().split(/\n/)[0]?.trim() ?? '';
  return ZH_SYSTEM_PROMPT_PREFIXES.some((prefix) => firstLine.includes(prefix));
}

export const ZH_WELCOME_MESSAGE_PREFIXES = ['歡迎！我是 AI 客服助手', '歡迎!我是 AI 客服助手'];

export function isZhDefaultWelcomeMessage(msg: string): boolean {
  const trimmed = (msg ?? '').trim();
  return ZH_WELCOME_MESSAGE_PREFIXES.some((p) => trimmed.includes(p));
}
