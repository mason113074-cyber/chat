import { getCached, deleteCachedPattern } from './cache';
import { getSupabaseAdmin } from './supabase';

const ANALYTICS_CACHE_TTL = 600; // 10 分鐘

export interface AnalyticsData {
  totalConversations: number;
  aiHandled: number;
  needsHuman: number;
  autoResolveRate: number;
  avgResponseTime: number;
  topIssues: Array<{ issue: string; count: number }>;
}

/**
 * 取得使用者的 Analytics 彙總（依 dateRange），結果快取 10 分鐘。
 * conversations 無 user_id，需經由 contacts 取得 contact_ids 再查詢。
 */
export async function getAnalyticsCached(
  userId: string,
  dateRange: { start: string; end: string }
): Promise<AnalyticsData> {
  const cacheKey = `analytics:${userId}:${dateRange.start}:${dateRange.end}`;

  return getCached(
    cacheKey,
    async () => {
      const supabase = getSupabaseAdmin();

      const { data: contactRows } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);
      const contactIds = (contactRows ?? []).map((c) => c.id);

      if (contactIds.length === 0) {
        return {
          totalConversations: 0,
          aiHandled: 0,
          needsHuman: 0,
          autoResolveRate: 0,
          avgResponseTime: 0,
          topIssues: [],
        };
      }

      const base = () =>
        supabase
          .from('conversations')
          .select('id, contact_id, role, status, resolved_by, is_resolved, created_at')
          .in('contact_id', contactIds)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

      const { data: rows } = await base();

      const assistantRows = (rows ?? []).filter((r) => r.role === 'assistant');
      const totalConversations = assistantRows.length;
      let aiHandled = 0;
      let needsHuman = 0;

      for (const r of assistantRows) {
        if (r.is_resolved === true || r.resolved_by === 'ai') aiHandled++;
        if (r.status === 'needs_human' || r.is_resolved === false) needsHuman++;
      }

      const autoResolveRate =
        totalConversations > 0 ? (aiHandled / totalConversations) * 100 : 0;

      return {
        totalConversations,
        aiHandled,
        needsHuman,
        autoResolveRate,
        avgResponseTime: 0, // TODO: 計算平均回應時間（需 user->assistant 成對時間差）
        topIssues: [], // TODO: 計算常見問題
      };
    },
    { ttl: ANALYTICS_CACHE_TTL }
  );
}

/**
 * 當有新對話或資料異動時，清除該使用者的 Analytics 快取
 */
export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  await deleteCachedPattern(`analytics:${userId}:*`);
}
