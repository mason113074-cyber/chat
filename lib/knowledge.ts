import { getSupabaseAdmin } from '@/lib/supabase';

const DEFAULT_LIMIT = 3;
const DEFAULT_MAX_CHARS = 2000;

function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[\s，。！？、；：""''（）,.;:!?]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Search knowledge_base for a user by message keywords.
 * Returns concatenated title+content of top matches, up to maxChars total.
 * Used to enrich system prompt for AI reply.
 */
export async function searchKnowledgeForUser(
  userId: string,
  message: string,
  limit: number = DEFAULT_LIMIT,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<string> {
  const client = getSupabaseAdmin();
  const { data: rows, error } = await client
    .from('knowledge_base')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(50);

  if (error || !rows || rows.length === 0) return '';

  const keywords = tokenizeQuery(message);
  if (keywords.length === 0) {
    // No keywords: use first few entries by default (optional)
    const parts: string[] = [];
    let total = 0;
    for (const r of rows.slice(0, limit)) {
      const block = `【${r.title}】\n${r.content}`;
      if (total + block.length > maxChars) break;
      parts.push(block);
      total += block.length;
    }
    return parts.length === 0 ? '' : parts.join('\n\n');
  }

  const scored = rows.map((row) => {
    const text = `${row.title} ${row.content}`.toLowerCase();
    let score = 0;
    for (const k of keywords) {
      if (text.includes(k.toLowerCase())) score++;
    }
    return { row, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.row);

  if (top.length === 0) return '';

  const parts: string[] = [];
  let total = 0;
  for (const r of top) {
    const block = `【${r.title}】\n${r.content}`;
    if (total + block.length > maxChars) break;
    parts.push(block);
    total += block.length;
  }
  return parts.join('\n\n');
}
