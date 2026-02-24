# Migrations 說明

本目錄為 Supabase PostgreSQL 遷移檔，依編號順序執行。

## 029 注意事項（ai_suggestions / 多 Bot）

- **唯一生效的 029**：`029_multibot_copilot.sql`  
  定義 `line_bots`、`webhook_events`、`ai_suggestions`（欄位：suggested_reply、status draft/sent/expired/rejected、bot_id、event_id、sent_by 等）。程式與 API 皆依此 schema。

- **歷史備援**：`029_ai_copilot_suggestions.sql.bak`  
  為舊版 ai_suggestions 定義（draft_text、pending/approved/sent），僅供參考。**新環境請勿執行 .bak 檔**，避免建出舊表或欄位不一致。

若既有環境曾只跑過舊版 029，需以 forward-only 遷移補齊欄位與狀態對應，不 drop 既有資料。見 `docs/REPO_STATUS_REPORT.md` 第 4.2 節建議。
