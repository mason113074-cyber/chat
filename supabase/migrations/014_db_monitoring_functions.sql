-- DB monitoring RPCs for index usage and slow query stats
-- get_slow_queries requires pg_stat_statements (enable in Dashboard → Database → Extensions)

-- 1. Index usage stats (from pg_stat_user_indexes, no extension required)
CREATE OR REPLACE FUNCTION public.get_index_usage_stats()
RETURNS TABLE (
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    s.schemaname::text,
    s.relname::text AS tablename,
    s.indexrelname::text AS indexname,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan DESC, s.relname, s.indexrelname;
$$;

COMMENT ON FUNCTION public.get_index_usage_stats() IS 'Returns index usage stats for public schema (for db-monitoring)';

-- 2. Slow queries (requires pg_stat_statements extension; returns empty if not available)
CREATE OR REPLACE FUNCTION public.get_slow_queries(limit_count integer DEFAULT 10)
RETURNS TABLE (
  query text,
  calls bigint,
  total_exec_time double precision,
  mean_exec_time double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF limit_count IS NULL OR limit_count < 1 THEN
    limit_count := 10;
  END IF;

  RETURN QUERY EXECUTE format(
    $q$
      SELECT
        left(pgs.query, 500)::text AS query,
        pgs.calls,
        round(pgs.total_exec_time::numeric, 2)::double precision AS total_exec_time,
        round(pgs.mean_exec_time::numeric, 2)::double precision AS mean_exec_time
      FROM pg_stat_statements pgs
      ORDER BY pgs.mean_exec_time DESC NULLS LAST
      LIMIT $1
    $q$
  ) USING limit_count;
EXCEPTION
  WHEN undefined_table OR undefined_object THEN
    RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_slow_queries(integer) IS 'Returns slow queries from pg_stat_statements; enable extension in Supabase Dashboard if empty';
