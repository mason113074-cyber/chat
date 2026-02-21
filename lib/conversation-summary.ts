/** Sprint 9: 對話摘要（用於多輪記憶省 Token） */
import { generateReply } from './openai';

export async function summarizeConversation(
  messages: { role: string; content: string }[]
): Promise<string> {
  if (messages.length === 0) return '';
  const conversationText = messages
    .map((m) => `${m.role === 'user' ? '用戶' : 'AI'}：${m.content}`)
    .join('\n');
  const summary = await generateReply(
    `請用 100 字以內摘要以下對話的重點：\n${conversationText}`,
    '你是對話摘要助手。只需要輸出摘要，不需要其他文字。',
    'gpt-4o-mini',
    undefined,
    undefined,
    undefined,
    { maxReplyLength: 150, replyFormat: 'concise' }
  );
  return summary;
}
