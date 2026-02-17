import { searchKnowledgeWithSources } from '@/lib/knowledge-search';

/**
 * Search knowledge_base for a user by message keywords.
 * Returns concatenated title+content of top matches, up to maxChars total.
 * Used to enrich system prompt for AI reply (chat, webhook).
 */
export async function searchKnowledgeForUser(
  userId: string,
  message: string,
  limit: number = 3,
  maxChars: number = 2000
): Promise<string> {
  const { text } = await searchKnowledgeWithSources(userId, message, limit, maxChars);
  return text;
}
