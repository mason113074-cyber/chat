# ai_suggestions Migration 收斂決策

**日期**：2026-02  
**結論**：保留 `029_multibot_copilot.sql` 作為唯一 ai_suggestions 建表來源；將未使用版本備份為 `029_ai_copilot_suggestions.sql.bak`。

---

## 保留的 migration

- **保留**：`supabase/migrations/029_multibot_copilot.sql`
- **用途**：建立 `line_bots`、`webhook_events`、`ai_suggestions`（含 RLS）。其中 ai_suggestions 欄位為：`suggested_reply`、`status`（draft/sent/expired/rejected）、`bot_id`、`event_id`、`user_message`、`sources_count`、`confidence_score`、`risk_category`、`sent_at`、`sent_by`、`expires_at` 等。

---

## 為何選 029_multibot_copilot（程式引用證據）

程式與 API 一律使用 **029_multibot_copilot** 的 schema：

| 位置 | 證據 |
|------|------|
| `app/api/webhook/line/route.ts` | `admin.from('ai_suggestions').insert({ suggested_reply: decision.draftText, status: 'draft', bot_id: botId, event_id: eventId, ... })` |
| `app/api/suggestions/[id]/send/route.ts` | `.select('... suggested_reply, status, expires_at')`、`.eq('status', 'draft')`、更新 `sent_at`/`sent_by` |
| `app/api/conversations/[id]/suggestions/route.ts` | `.select('... suggested_reply, ... status ...')`、回傳時映射 `draft_text: row.suggested_reply`、`statusFilter = normalizedStatus === 'pending' ? 'draft' : ...` |
| `app/api/contacts/[id]/suggestions/route.ts` | `.select('... suggested_reply, ...').eq('status', 'draft')` |

未使用 029_ai_copilot_suggestions 的 `draft_text`、`status IN ('pending','approved','sent')`、`source_message_id`、`action`、`approved_by` 等欄位。

---

## 備份檔路徑

- **備份檔**：`supabase/migrations/029_ai_copilot_suggestions.sql.bak`
- **說明**：原 029_ai_copilot_suggestions.sql 僅作備份保留，**不再納入 migration 執行順序**（Supabase 只會執行 `.sql`，不執行 `.bak`）。

---

## 若未來要恢復另一套（029_ai_copilot_suggestions）需做什麼

1. **僅作參考**：需要「舊版」欄位設計時，可從 `029_ai_copilot_suggestions.sql.bak` 複製定義查閱，勿直接重新執行（會與現有 ai_suggestions 表衝突）。
2. **若真要還原舊 schema**（不建議）：
   - 需先備份現有資料；
   - 建立新的 forward migration：例如改表名為 `ai_suggestions_v1_legacy` 或新增相容用 view，再依業務決定是否遷移資料、改寫 API 使用 `draft_text`/pending/approved/sent。
3. **建議**：維持單一來源 029_multibot_copilot，新需求以 ALTER / 新 migration 擴充欄位，不恢復兩套並存。
