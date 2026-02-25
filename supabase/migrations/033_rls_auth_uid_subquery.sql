-- =====================================================
-- RLS: auth.uid() → (select auth.uid()) 效能優化（草稿 Part 1）
-- 目的：每條 policy 改為 (select auth.uid())，讓 Postgres 每 statement 只評估一次，
--       減少高併發下的鎖競爭與重複函數呼叫。
-- 做法：分批執行，本檔先處理 users / contacts / knowledge_base；其餘表見下方註解。
-- 參考：docs/DEEP_DIVE_IMPROVEMENTS.md 2.5、engineering-status.mdc P1
-- =====================================================

-- ---------- public.users ----------
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ---------- public.contacts ----------
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;
CREATE POLICY "Users can manage own contacts" ON public.contacts
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ---------- public.knowledge_base ----------
DROP POLICY IF EXISTS "Users can manage own knowledge" ON public.knowledge_base;
CREATE POLICY "Users can manage own knowledge" ON public.knowledge_base
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 待後續 migration 處理（依表名列出，避免一次改動過大）：
-- - conversations: "Users can view conversations of own contacts", "Users can insert conversations for own contacts"
-- - orders: "Users can view orders of own contacts"
-- - subscriptions: "Users can manage own subscriptions"
-- - contact_tags: "Users can manage own tags"
-- - contact_tag_assignments: "Users can manage own tag assignments"
-- - openai_usage: "Users can view own usage"
-- - ai_guidance_rules: "Users can manage own guidance rules"
-- - ai_feedback: "Users can view own feedback"（Service role insert 不動）
-- - ab_tests: "Users manage own ab_tests"
-- - ab_test_assignments: "Users manage own ab_assignments via test"
-- - line_bots: "Users manage own line_bots"
-- - ai_suggestions: "Users manage own ai_suggestions via contact"
-- - workflows: "Users manage own workflows"
-- - workflow_logs: "Users view own workflow logs", "Users insert logs for own workflows"
-- - customer_events, customer_segments, customer_health_scores, message_sentiments, sentiment_alerts, campaigns, campaign_logs, api_keys (027)
-- - conversation_notes, routing_rules (028)
-- - health_check_logs (018/019)
-- =====================================================
