import { getSupabaseAdmin } from './supabase';

export interface IndexUsageRow {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export interface SlowQueryRow {
  query: string;
  calls: number;
  total_exec_time: number;
  mean_exec_time: number;
}

export async function getIndexUsageStats(): Promise<IndexUsageRow[] | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('get_index_usage_stats');
  if (error) {
    console.error('[DB Monitoring] Failed to get index stats:', error);
    return null;
  }
  return data as IndexUsageRow[];
}

export async function getSlowQueries(limit: number = 10): Promise<SlowQueryRow[] | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('get_slow_queries', { limit_count: limit });
  if (error) {
    console.error('[DB Monitoring] Failed to get slow queries:', error);
    return null;
  }
  return data as SlowQueryRow[];
}
