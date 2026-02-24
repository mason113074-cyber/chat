# Post-Merge Release Verification Report — PR #14（AI 副駕模式）

**日期**：2025-02-22  
**範圍**：PR #14 merge 後之 production 部署確認、Supabase 健康檢查、手動冒煙 DoD、風險與建議。

---

## 1) Vercel Production 部署確認

**來源**：Vercel MCP `list_deployments`（project: chat-l27v, team: mason4）。

| 項目 | 值 |
|------|-----|
| **最新 production deployment** | 是（target=production） |
| **Deployment URL** | chat-l27v-huc94qdnl-mason4.vercel.app |
| **State** | READY |
| **GitHub Commit SHA** | 520774761623a41d36fb92d497b3dc026dce300e |
| **GitHub Commit Message** | Merge pull request #14 from mason113074-cyber/cursor/ai-4fdf — Ai 副駕模式 |
| **Ref** | main |
| **Created (epoch ms)** | 1771766383255 |

**結論**：Production 已部署至「Merge PR #14」的版本（commit 52077476…），對應 Ai 副駕模式上線。

---

## 2) Supabase 資料庫健康檢查摘要

**專案**：chat（ref: aqnjiyuyopyuklragaau）。  
**查詢時間**：同報告日期。

### 表存在與筆數

| 表名 | 筆數 |
|------|------|
| ai_suggestions | 0 |
| contacts | 1 |
| conversations | 20 |
| line_bots | 0 |

### ai_suggestions 最近 20 筆

- 查詢：`SELECT id, status, created_at FROM public.ai_suggestions ORDER BY created_at DESC LIMIT 20`
- **結果**：0 筆（表為空，屬正常初態或尚未有副駕草稿）

### RLS（Row Level Security）

| 表名 | relrowsecurity |
|------|----------------|
| ai_suggestions | true |
| contacts | true |
| conversations | true |
| line_bots | true |

**結論**：四張核心表皆存在、RLS 已啟用；ai_suggestions 目前無資料，可於冒煙測試後再查一次確認草稿寫入。

---

## 3) 手動冒煙測試清單（DoD）

以下 6 條為上線驗收必做項目；每條需在 **production（customeraipro.com / www.customeraipro.com）** 或已綁定之 LINE 環境執行並記錄結果。

| # | 項目 | 操作 | 預期結果 | 失敗代表 |
|---|------|------|----------|----------|
| **D1** | LINE 一般問題 → AUTO | 用 LINE 發一則知識庫可回答的一般問題 | 應收到 AI 回覆；後台該聯絡人對話紀錄中出現 assistant 訊息、status 為 ai_handled（或等同） | 決策未走 AUTO、知識庫/API 異常、或寫入失敗 |
| **D2** | 高風險不 AUTO | 用 LINE 發含「退款/折扣/價格/賠償」等敏感詞 | 不應收到 AI 承諾式回覆；應產生 ai_suggestions 草稿（status=draft）且 LINE 收到固定 ack/handoff（如「已收到，我們將由專員協助」） | 高風險判斷或 handoff 分支未生效 |
| **D3** | ASK 缺欄位先問 | 發需補充資訊的問題（如退換貨但未提供訂單號） | 應先回 1～3 個關鍵問題（例：請提供訂單號/商品/日期），不直接承諾結果 | ASK 邏輯或 prompt 未生效 |
| **D4** | SUGGEST 草稿可見可編 | 觸發一筆 SUGGEST（低信心或無 sources） | 後台「建議回覆」或對話詳情中能看到該筆草稿，且可編輯內容 | 草稿未寫入或 UI 未正確綁定 |
| **D5** | 一鍵送出防雙發 | 對同一筆 suggestion 連點兩次「送出」 | 第一次成功；第二次應 404 或「Not found or already sent」；LINE 只收到一則；ai_suggestions 該筆 status=sent、sent_at 有值 | 原子更新未鎖住或前端重複送 |
| **D6** | 錯誤不吞掉 | 暫時讓 DB/外部服務失敗（如斷線或故意錯 key） | 至少有一方可追蹤：Vercel Runtime Logs / Supabase logs / 回傳 5xx；不應靜默吞錯 | 錯誤處理或 log 不足 |

---

## 4) 風險點與下一步建議

- **風險**：line_bots 目前 0 筆時，若使用「單一 LINE webhook」路由（非多 bot），需確認 LINE_OWNER_USER_ID / 單 bot 設定已設；多 bot 路由則需至少一筆 line_bots 且 webhook 指到正確 [botId]/[webhookKey]。
- **建議**：
  1. 依 DoD D1～D6 在 production 跑一輪並記錄 pass/fail。
  2. 若有 B1 事件佇列（webhook_events / process）：確認 production 的 ENCRYPTION_MASTER_KEY、INTERNAL_QUEUE_SECRET、APP_URL 等已設且與 Runbook 一致。
  3. 修 CI type-check（e2e/audit.spec.ts）後合入 main，確保後續 PR 不因該檔失敗。

---

（報告完）
