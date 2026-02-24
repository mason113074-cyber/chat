# Release 稽核回報 — PR #14 上線後（修 CI / 冒煙 / B1 PR）

**日期**：2025-02-22  
**範圍**：Type-check 修復 PR 建立與合併指引、Production 冒煙測試步驟與 DB 查詢摘要、B1 PR 連結與上線前 env 清單。

---

## A) Type-check 修復 PR（fix/typecheck-audit-e2e）

### 1) 分支與 CI 確認結果

| 項目 | 結果 |
|------|------|
| 分支 | fix/typecheck-audit-e2e 已存在於 origin |
| npm run lint | pass |
| npm run build | pass |
| npm run type-check | pass |

### 2) 可直接開 PR 的連結

https://github.com/mason113074-cyber/chat/compare/main...fix/typecheck-audit-e2e?expand=1  

（手動點 **Create pull request** 後再 **Merge**。）

### 3) 建議 PR 標題

`Fix CI type-check (e2e/audit.spec.ts) + post-merge verification & smoke runbook`

### 4) 建議 PR 描述

```
- 修復 e2e/audit.spec.ts 第 125 行：test.skip 第一參數改為 Boolean(baseURL?.includes(...))，解決 boolean|undefined 與 Playwright overload 不符導致 type-check 失敗。
- 新增 POST_MERGE_VERIFICATION_PR14.md、PROD_SMOKE_TEST_PR14.md（上線驗收與冒煙 Runbook）。
- 不改任何 production 業務邏輯；僅 e2e 型別 + docs。
- 驗證：lint / build / type-check 皆 pass。
```

### 5) 本 PR 包含的 commit（message + SHA 短碼）

| SHA 短碼 | Commit message |
|----------|----------------|
| c230450 | fix(e2e): resolve type-check overload in audit.spec.ts |
| 772b833 | docs: add post-merge verification report (PR14) |
| 4275b5f | docs: add production smoke test runbook (PR14) |

### 6) 是否影響 production 行為

**不影響。** 僅修改 e2e 型別（一處 Boolean 轉換）與新增兩份 docs；無 API、無 webhook、無前端業務邏輯變更。

### 7) Merge 後驗證（請你 merge 後執行或由我以 Vercel MCP 代查）

- 在 GitHub 將 fix/typecheck-audit-e2e 合併進 main。
- 合併後 Vercel 會自動部署；用 Vercel MCP `list_deployments`（project: chat-l27v, target=production）確認最新 production deployment 的 **githubCommitMessage** 對應該 merge commit（例如 "Merge pull request #xx … Fix CI type-check"）。
- 若你已 merge，告知我，我可代為查一次 production 最新 deployment 並回報 commit message / SHA。

---

## B) Production 冒煙測試（讓 ai_suggestions 從 0 變 1）

### 1) 你要做的 2 次 LINE 測試（你發訊息，我查 DB）

| 測試 | 目的 | 請發這一句（範例） |
|------|------|---------------------|
| **測試 1：一般問題（低風險）** | 觸發 AUTO/ASK，conversations 新增 assistant | 「請問營業時間是幾點？」或「退換貨流程怎麼申請？」（依你知識庫內容擇一） |
| **測試 2：高風險** | 觸發 draft，ai_suggestions 至少 1 筆 | 「我要退款」或「可以給我折扣嗎」或「價格有問題」 |

發完後告知我「已發測試 1」「已發測試 2」，我會再跑下面三段 SQL 並回傳摘要。

### 2) Supabase 查詢摘要（本次執行結果）

**SQL-1（ai_suggestions 最新 20）**  
- 結果：**0 筆**（表為空）。  
- 驗收目標：你發完**測試 2（高風險）**後再查，應至少 **1 筆**，status=draft；一鍵送出後該筆 status=sent、sent_at 有值。

**SQL-2（conversations 最新 20）**  
- 結果：20 筆，同一 contact_id，role 為 user / assistant 交錯，resolved_by 有 ai、unresolved，created_at 自 2026-02-17 至 2026-02-21。  
- 驗收目標：發完**測試 1**後，最新一筆應為 role=assistant，對應該次 AI 回覆。

**SQL-3（webhook_events 狀態分佈）**  
- 結果：**N/A**（production 目前未部署 B1，webhook_events 表可能不存在或為空；查詢回傳空）。

### 3) 驗收條件（必達）

- **高風險訊息後**：ai_suggestions 至少出現 **1 筆** status=draft（或 pending）。  
- **執行一次「一鍵送出」**：該筆 status 變 **sent**，sent_at 有值；LINE 只收到 **1 則**。  
- **同一筆再送第二次**：必須被拒絕或冪等（API 回 404 / "Not found or already sent"）；LINE 不應收到第二則。

---

## C) B1 PR（只建立，不 merge）

### 1) B1 PR compare link

https://github.com/mason113074-cyber/chat/compare/main...b1/event-queue-multibot?expand=1  

（手動點 **Create pull request**；**先不要 merge**。）

### 2) PR 描述草稿（短、可驗收）

```
## B1: Event queue — webhook 只 persist + enqueue + 200，回覆改由 internal process push-only

- **Webhook**：驗簽 → 每 event 寫入 webhook_events(pending) → enqueue 至 QStash（可選）→ 立即 200，不做同步處理、不呼叫 handleEvent。
- **Internal process / drain**：由 POST /api/internal/webhook-events/process（Bearer 或 QStash）或 drain cron 消化 pending；處理端僅用 pushMessage 回覆（push-only）。
- **風險**：改動核心回覆路徑，需先在 **Preview** 依 Runbook 完成 DoD（pending 消化、process 200、高風險只 ack、防雙發等）再 merge。
- 詳見 docs/REPORTS/IMPLEMENTATION_B1_EVENT_QUEUE_MULTIBOT.md、B1_PREVIEW_ACTIVATION_RUNBOOK.md。
```

### 3) B1 上 production 前必備 env 名稱清單（只列名稱）

- ENCRYPTION_MASTER_KEY  
- LINE_BOT_ENCRYPTION_KEY  
- INTERNAL_QUEUE_SECRET  
- HEALTHCHECK_CRON_SECRET  
- QSTASH_TOKEN（若要自動觸發 process）  
- APP_URL（production domain，供 drain 組 process URL）  

---

（報告完）
