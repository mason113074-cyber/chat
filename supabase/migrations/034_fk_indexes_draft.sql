-- =====================================================
-- FK 索引補齊（草稿）
-- 目的：對常被 JOIN / WHERE 使用的 FK 欄位建立索引，提升查詢效能。
-- 參考：engineering-status.mdc P1「7 個 FK 缺索引」、docs/DEEP_DIVE_IMPROVEMENTS.md 2.5
-- 說明：CREATE INDEX IF NOT EXISTS 已存在則跳過，可安全重複執行。
-- =====================================================

-- ab_test_assignments: 依 contact 查 assignment、JOIN ab_tests
-- （ab_test_id 已有 idx_ab_assignments_test，024）
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_contact_id
  ON public.ab_test_assignments(contact_id);

-- ai_feedback: 依 contact / conversation 篩選或 JOIN
-- （user_id 已有 idx_ai_feedback_user，024）
CREATE INDEX IF NOT EXISTS idx_ai_feedback_contact_id
  ON public.ai_feedback(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation_id
  ON public.ai_feedback(conversation_id);

-- ai_suggestions: 依 contact / bot 查詢（029/032）
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_contact_id
  ON public.ai_suggestions(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_bot_id
  ON public.ai_suggestions(bot_id);

-- conversations: ab_test_id 為 024 新增 FK，篩選 A/B 用
CREATE INDEX IF NOT EXISTS idx_conversations_ab_test_id
  ON public.conversations(ab_test_id);

-- workflow_logs: 依 workflow 或 conversation 查 log
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_id
  ON public.workflow_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_conversation_id
  ON public.workflow_logs(conversation_id);

-- =====================================================
-- 索引註解（維護用）
-- =====================================================
COMMENT ON INDEX idx_ab_test_assignments_contact_id IS 'FK index: list assignments by contact';
COMMENT ON INDEX idx_ai_feedback_contact_id IS 'FK index: feedback by contact';
COMMENT ON INDEX idx_ai_feedback_conversation_id IS 'FK index: feedback by conversation';
COMMENT ON INDEX idx_ai_suggestions_contact_id IS 'FK index: suggestions by contact';
COMMENT ON INDEX idx_ai_suggestions_bot_id IS 'FK index: suggestions by bot';
COMMENT ON INDEX idx_conversations_ab_test_id IS 'FK index: conversations by ab_test';
COMMENT ON INDEX idx_workflow_logs_workflow_id IS 'FK index: logs by workflow';
COMMENT ON INDEX idx_workflow_logs_conversation_id IS 'FK index: logs by conversation';
