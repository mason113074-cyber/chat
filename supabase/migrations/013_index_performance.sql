-- =====================================================
-- CustomerAIPro 資料庫索引優化
-- 目的：提升查詢效能，特別是高頻查詢路徑
-- 說明：conversations 無 user_id（user 經由 contact_id → contacts.user_id）；
--      訊息存於 conversations 表，無獨立 conversation_messages 表；
--      contacts 無 email 欄位；knowledge_base 使用 is_active；
--      標籤為 contact_tags / contact_tag_assignments，無 auto_tags 表。
-- =====================================================

-- 1. conversations 表優化
-- 用途：對話列表／搜尋特定聯絡人的對話（依 contact 時間序）
CREATE INDEX IF NOT EXISTS idx_conversations_contact_created
  ON public.conversations(contact_id, created_at DESC);

-- 用途：依 status 篩選（needs_human / ai_handled）
CREATE INDEX IF NOT EXISTS idx_conversations_contact_status
  ON public.conversations(contact_id, status);

-- 用途：Analytics／統計（依 contact + 時間 + status）
CREATE INDEX IF NOT EXISTS idx_conversations_contact_created_status
  ON public.conversations(contact_id, created_at DESC, status);

-- 註：對話列表「依 user 篩選」需先查 contacts(user_id)，再以 contact_id 查 conversations，以上索引支援該路徑。

-- 2. conversation_messages 表優化
-- 本專案無 conversation_messages 表，訊息即 conversations 的每一列，已於第 1 段建立索引，此節略過。
-- 若日後拆出 conversation_messages，可再新增：
--   idx_messages_conversation_created ON conversation_messages(conversation_id, created_at DESC);
--   idx_messages_conversation_role_resolved, idx_messages_unresolved 等。

-- 3. contacts 表優化
-- 註：LINE 查找已有 contacts_line_user_id_idx，不重複建立。

-- 用途：使用者的聯絡人列表（篩選 + 排序）
CREATE INDEX IF NOT EXISTS idx_contacts_user_created
  ON public.contacts(user_id, created_at DESC);

-- 用途：依 user + status 篩選（pending / resolved）
CREATE INDEX IF NOT EXISTS idx_contacts_user_status
  ON public.contacts(user_id, status);

-- 註：contacts 表無 email 欄位，故未建立 email 索引。

-- 4. knowledge_base 表優化
-- 用途：知識庫列表（使用者 + 時間排序）
CREATE INDEX IF NOT EXISTS idx_knowledge_user_created
  ON public.knowledge_base(user_id, created_at DESC);

-- 用途：啟用狀態的知識庫（向量／關鍵字搜尋前篩選；本表使用 is_active）
-- 已有 idx_knowledge_base_user_active ON (user_id, is_active) WHERE is_active = true，不重複建立。

-- 5. 標籤表優化（contact_tags / contact_tag_assignments，無 auto_tags 表）
-- 用途：依 user 列出標籤
CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id
  ON public.contact_tags(user_id);

-- 用途：依 contact 查標籤、依 tag 查聯絡人
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id
  ON public.contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id
  ON public.contact_tag_assignments(tag_id);

-- 6. 複合索引優化（針對 Analytics 頁面）
-- 註：conversations 無 user_id，依 user 的統計需 JOIN contacts。時間範圍篩選可用 created_at，已由 idx_conversations_contact_created_status 涵蓋。

-- 7. 全文搜尋索引（可選，會增加儲存空間）
-- 若需搜尋對話內容可於 conversations 建立：
-- CREATE INDEX IF NOT EXISTS idx_conversations_message_fts
--   ON public.conversations USING gin(to_tsvector('simple', message));

-- =====================================================
-- 索引註解（維護用）
-- =====================================================
COMMENT ON INDEX idx_conversations_contact_created IS 'Optimize message list per contact (conversation detail)';
COMMENT ON INDEX idx_conversations_contact_status IS 'Filter conversations by status per contact';
COMMENT ON INDEX idx_contacts_user_created IS 'User contact list with created_at sort';
COMMENT ON INDEX idx_knowledge_user_created IS 'Knowledge base list by user and time';
