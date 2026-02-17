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

export type KnowledgeSource = { id: string; title: string; category: string };

export type KnowledgeSearchResult = { text: string; sources: KnowledgeSource[] };

/**
 * Search knowledge_base for a user by message keywords.
 * Returns concatenated title+content (for system prompt) and the list of sources (id, title, category).
 * Shared by /api/chat, /api/webhook/line, and /api/knowledge-base/test.
 */
export async function searchKnowledgeWithSources(
  userId: string,
  message: string,
  limit: number = DEFAULT_LIMIT,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<KnowledgeSearchResult> {
  const client = getSupabaseAdmin();
  const { data: rows, error } = await client
    .from('knowledge_base')
    .select('id, title, content, category')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(50);

  if (error || !rows || rows.length === 0) {
    return { text: '', sources: [] };
  }

  const keywords = tokenizeQuery(message);
  let top: { id: string; title: string; content: string; category: string }[];

  if (keywords.length === 0) {
    top = rows.slice(0, limit) as { id: string; title: string; content: string; category: string }[];
  } else {
    const scored = rows.map((row: { id: string; title: string; content: string; category?: string }) => {
      const text = `${row.title} ${row.content}`.toLowerCase();
      let score = 0;
      for (const k of keywords) {
        if (text.includes(k.toLowerCase())) score++;
      }
      return { row, score };
    });
    scored.sort((a, b) => b.score - a.score);
    top = scored
      .filter((s) => s.score > 0)
      .slice(0, limit)
      .map((s) => s.row as { id: string; title: string; content: string; category: string });
  }

  if (top.length === 0) {
    return { text: '', sources: [] };
  }

  const parts: string[] = [];
  const sources: KnowledgeSource[] = [];
  let total = 0;
  for (const r of top) {
    const block = `【${r.title}】\n${r.content}`;
    if (total + block.length > maxChars) break;
    parts.push(block);
    sources.push({ id: r.id, title: r.title, category: r.category ?? 'general' });
    total += block.length;
  }

  return { text: parts.join('\n\n'), sources };
}
