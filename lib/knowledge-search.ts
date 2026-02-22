import crypto from 'crypto';
import { getCached, deleteCachedPattern } from './cache';
import { getSupabaseAdmin } from '@/lib/supabase';

const DEFAULT_LIMIT = 3;
const DEFAULT_MAX_CHARS = 2000;
const KNOWLEDGE_SEARCH_CACHE_TTL = 300; // 5 分鐘
const CACHE_PREFIX = 'knowledge_search:';

const CJK_REGEX = /[\u4E00-\u9FFF]/;
const MAX_TOKENS = 40;

function addCjkNgrams(token: string, n: number, out: Set<string>): void {
  for (let i = 0; i <= token.length - n; i++) {
    out.add(token.slice(i, i + n));
  }
}

/**
 * Tokenize query for knowledge search. Splits on whitespace/punctuation.
 * For tokens containing CJK, also emits 2- and 3-char n-grams so Chinese phrases can match.
 * Exported for tests.
 */
export function tokenizeQuery(query: string): string[] {
  const raw = query
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[\s，。！？、；：""''（）,.;:!?]+/)
    .filter((t) => t.length >= 2);

  const set = new Set<string>();
  for (const token of raw) {
    if (CJK_REGEX.test(token)) {
      if (token.length >= 2) addCjkNgrams(token, 2, set);
      if (token.length >= 3) addCjkNgrams(token, 3, set);
    } else {
      set.add(token);
    }
  }
  return Array.from(set).slice(0, MAX_TOKENS);
}

export type KnowledgeSource = { id: string; title: string; category: string };

export type KnowledgeSearchResult = { text: string; sources: KnowledgeSource[] };

/**
 * Search knowledge_base for a user by message keywords.
 * Returns concatenated title+content (for system prompt) and the list of sources (id, title, category).
 * Shared by /api/chat, /api/webhook/line, and /api/knowledge-base/test.
 * Results are cached 5 min by userId + message + limit + maxChars.
 */
export async function searchKnowledgeWithSources(
  userId: string,
  message: string,
  limit: number = DEFAULT_LIMIT,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<KnowledgeSearchResult> {
  const queryHash = crypto
    .createHash('md5')
    .update(`${userId}:${message}:${limit}:${maxChars}`)
    .digest('hex')
    .substring(0, 12);
  const cacheKey = `${CACHE_PREFIX}${userId}:${queryHash}`;

  return getCached(
    cacheKey,
    async () => {
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
    },
    { ttl: KNOWLEDGE_SEARCH_CACHE_TTL }
  );
}

/**
 * 當知識庫新增/更新/刪除時呼叫，清除該使用者的所有搜尋快取
 */
export async function clearKnowledgeCache(userId: string): Promise<void> {
  await deleteCachedPattern(`${CACHE_PREFIX}${userId}:*`);
}
