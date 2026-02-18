# Supabase 修復與優化（一次執行）

當正式環境出現「無法載入設定」、設定頁 500、或 Dashboard 統計異常時，多半是資料庫缺少部分 migration 的欄位或物件。本專案提供**單一 SQL 腳本**，可在 Supabase 上一次補齊並優化。

## 執行步驟

1. 開啟 [Supabase Dashboard](https://supabase.com/dashboard) → 選擇專案。
2. 左側選 **SQL Editor** → **New query**。
3. 複製整份腳本內容：  
   `supabase/migrations/016_supabase_fix_and_optimize.sql`
4. 貼到編輯器後按 **Run**（或 Ctrl+Enter）。
5. 確認最後一筆結果為：`Supabase 修復與優化執行完成`。

## 腳本內容摘要

| 項目 | 說明 |
|------|------|
| **users** | 補齊 `system_prompt`、`ai_model`、`store_name`、`industry`、`onboarding_completed`、LINE 欄位、`quick_replies`（僅補缺、不覆寫既有值） |
| **conversations** | 補齊 `status`、`resolved_by`、`is_resolved` |
| **contacts** | 補齊 `status` |
| **knowledge_base** | 若表不存在則建立並設 RLS、索引 |
| **contact_tags / contact_tag_assignments** | 若表不存在則建立並設 RLS、索引 |
| **get_dashboard_stats** | 建立或更新 RPC，供 Dashboard 並行統計使用 |
| **索引** | 對話、聯絡人、知識庫查詢與篩選用索引 |

全部使用 `ADD COLUMN IF NOT EXISTS`、`CREATE TABLE IF NOT EXISTS`、`CREATE INDEX IF NOT EXISTS`、`CREATE OR REPLACE FUNCTION`，**可重複執行**，不會刪除或覆寫既有資料。

## 執行後建議

- 重新整理 **設定頁**，確認不再出現「無法讀取設定」。
- 若使用 Playwright 檢查表，可再跑一次 `npx playwright test e2e/checklist.spec.ts --project=chromium` 確認通過。
