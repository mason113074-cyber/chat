# P0 實作報告：多 Bot + AI 副駕 SUGGEST

**日期**：2025-02-21  
**範圍**：多 bot 支援、webhook 先落庫再回 200、LINE client 注入、SUGGEST 草稿、suggestions API、加解密 helper。  
**限制**：未改既有 production 文案、未大規模重構；未洩漏任何 secret（僅 env 變數名、DB 欄位名）。

---

## 1. Git log（本次新增的 commit 清單）

```
717e963 docs: add IMPLEMENTATION_P0_MULTIBOT_COPILOT report
e1c0fac chore(env): document LINE_BOT_ENCRYPTION_KEY for multi-bot
a044239 feat(api): GET suggestions, POST suggestion send, GET/POST settings/bots
375f575 feat(webhook): add route /api/webhook/line/[botId]/[webhookKey], persist webhook_events then 200
6361321 feat(webhook): handleEvent overrides (ownerUserId, credentials, botId) and SUGGEST branch
eeeae2a feat(lib): line client accept injected credentials; idempotency scoped by botId
a8b8bbc feat(lib): add AES-256-GCM encrypt/decrypt and webhook key hash helper
e497adc feat(db): add line_bots, webhook_events, ai_suggestions with RLS
```

---

## 2. 新增/修改的檔案清單（按類別）

### Migrations
| 檔案 | 說明 |
|------|------|
| `supabase/migrations/029_multibot_copilot.sql` | 新增 line_bots、webhook_events、ai_suggestions 三表及 RLS |

### API routes
| 檔案 | 說明 |
|------|------|
| `app/api/webhook/line/[botId]/[webhookKey]/route.ts` | 新增多 bot webhook：bot 查詢、驗簽、寫入 webhook_events 後處理、回 200 |
| `app/api/contacts/[id]/suggestions/route.ts` | GET 該聯絡人的 draft suggestions |
| `app/api/suggestions/[id]/send/route.ts` | POST 審核送出：推送到 LINE、寫入 conversation、更新 sent_at / sent_by |
| `app/api/settings/bots/route.ts` | GET 列出 bots、POST 建立 bot（加密儲存、回傳 webhook_key 與 URL path） |

### Lib
| 檔案 | 說明 |
|------|------|
| `lib/encrypt.ts` | 新增：AES-256-GCM 加解密、hashWebhookKey（SHA-256 hex） |
| `lib/line.ts` | 修改：LineCredentials、validateSignature 第三參數、replyMessage/pushMessage 可傳入 credentials |
| `lib/idempotency.ts` | 修改：isProcessed / markAsProcessed 可選 botId 以區分多 bot |

### 既有 webhook（修改）
| 檔案 | 說明 |
|------|------|
| `app/api/webhook/line/route.ts` | 匯出 handleEvent、WebhookLineOverrides；handleEvent 接受 overrides（ownerUserId、credentials、botId）；所有 replyMessage/pushMessage 傳入 creds；markAsProcessed 傳入 botId；新增 SUGGEST 分支（寫入 ai_suggestions 不送 LINE） |

### Docs / 設定
| 檔案 | 說明 |
|------|------|
| `.env.example` | 新增 LINE_BOT_ENCRYPTION_KEY 註解（多 bot 加密用） |
| `docs/REPORTS/IMPLEMENTATION_P0_MULTIBOT_COPILOT.md` | 本報告 |

---

## 3. 每個 P0 任務的驗收結果（Checklist）

| # | P0 任務 | 驗收 | 備註 |
|---|---------|------|------|
| 1 | DB：新增 line_bots、webhook_events、ai_suggestions（含 RLS） | ✅ | 029  migration：line_bots（user_id、webhook_key_hash、encrypted_*）、webhook_events（bot_id、raw_body、status）、ai_suggestions（contact_id、user_id、bot_id、event_id、suggested_reply、status、sent_at、sent_by）；RLS 見 §4 |
| 2 | Webhook：新增 /api/webhook/line/[botId]/[webhookKey]；botId+webhookKey 定位 bot；bot 的 channelSecret 驗簽；先落 webhook_events 再回 200 | ✅ | 動態 route：查 line_bots → hash 比對 webhookKey → 解密 secret → validateSignature(body, signature, channelSecret) → insert webhook_events → 處理 events → update status processed → 200 |
| 3 | LINE client：lib/line.ts 支援注入 channelSecret / channelAccessToken | ✅ | LineCredentials、validateSignature(body, sig, channelSecretOverride)、replyMessage(,,, creds)、pushMessage(,, creds)、getLineClient(credentials) |
| 4 | 決策：新增 SUGGEST 分支（高風險/低信心/無 sources 不直接送 LINE；寫入 ai_suggestions draft、標 needs_human） | ✅ | handleEvent 內：當 botId 且 (sources.length===0 或 confidence.score < threshold) 時寫入 ai_suggestions(status=draft)、insertConversationMessage(user)、markAsProcessed、return；不呼叫 replyMessage(finalReply) |
| 5 | API：GET /api/contacts/[id]/suggestions、POST /api/suggestions/[id]/send（送出後 status=sent + 稽核欄位） | ✅ | GET 回傳 draft 且未過期；POST 驗證權限、解密 bot token、pushMessage、insertConversationMessage、更新 sent_at / sent_by |
| 6 | 加解密 helper（AES-256-GCM）；bot secrets/tokens 不以明文儲存 | ✅ | lib/encrypt.ts：encrypt/decrypt 使用 LINE_BOT_ENCRYPTION_KEY；line_bots 僅存 encrypted_channel_secret、encrypted_channel_access_token |

---

## 4. 實作細節：webhookKey hash、加密欄位、RLS、service role

- **webhookKey hash**：建立 bot 時以 `hashWebhookKey(webhookKey)`（SHA-256 hex）寫入 `line_bots.webhook_key_hash`。請求時以 path 的 webhookKey 做相同 hash 與 DB 比對，通過才解密驗簽；不明文存 webhookKey。
- **加密欄位**：`line_bots.encrypted_channel_secret`、`encrypted_channel_access_token` 以 `encrypt(plaintext)` 寫入（AES-256-GCM，key 來自 `LINE_BOT_ENCRYPTION_KEY`）；讀取時 `decrypt(encoded)`，僅在驗簽或送 LINE 時解密，用完即不保留。
- **RLS**：`line_bots` 為 `auth.uid() = user_id`；`ai_suggestions` 為透過 contact 所屬 user 限制（user_id + EXISTS contact）；`webhook_events` 為 FOR ALL USING (false) WITH CHECK (false)，僅 service role 可寫入/更新（service role 略過 RLS）。
- **Service role**：新 webhook route、POST send、POST /api/settings/bots 在需寫入 webhook_events、讀取/解密 line_bots、更新 ai_suggestions 時使用 `getSupabaseAdmin()`；其餘用 `createClient()`（session）以符合 RLS。

---

## 5. 如何確保「AI 不會直接送出高風險內容」：決策分支位置

- **高風險/中風險敏感詞**：`app/api/webhook/line/route.ts` 約 252–281 行。`detectSensitiveKeywords` 非 low 時回覆固定句（SENSITIVE_CONTENT_REPLY）、return，**不呼叫 AI、不送 finalReply**。
- **自訂敏感詞**：約 393–399 行。命中時回覆設定或固定句、return。
- **SUGGEST 分支（不直接送 LINE）**：約 556–577 行（P0 新增）。條件為 `botId && (sources.length === 0 || confidence.score < threshold)` 時寫入 `ai_suggestions`（draft）、寫入 user message、**不呼叫 replyMessage(finalReply)**、return。
- **低信心覆寫**：約 543–554 行。confidence < threshold 時將 finalReply 改為 handoff_message 或 append 免責；若同時在「多 bot」路徑則上面 SUGGEST 分支先觸發，不會送到 LINE。
- **輸出 guardrail**：約 524–532 行。FORBIDDEN_PATTERNS 命中時 finalReply 改為 GUARDRAIL_SAFE_REPLY；長度截斷。之後才進入 SUGGEST 判斷或 replyMessage。

以上分支確保：高風險輸入不進 AI；低信心/無 sources 在多 bot 路徑改為草稿；其餘才可能 replyMessage(finalReply)。

---

## 6. TODO / 技術債（P1 建議）

| 項目 | 說明 |
|------|------|
| Workflow 多 bot | handleEvent 內觸發 WorkflowEngine 時，replyMessage/pushMessage 仍用全域 client；多 bot 路徑下應傳入 credentials（或 WorkflowEngine 接受 credentials 參數）。 |
| type-check | e2e/audit.spec.ts 型別錯誤導致 `npm run type-check` 失敗；非本次變更範圍，建議另修。 |
| 舊版 webhook 相容 | 現有 /api/webhook/line 未改動；若未來僅保留多 bot URL，可考慮 redirect 或同一 handler 依 path 選擇 env vs bot。 |
| 前端草稿 UI | GET suggestions、POST send 已就緒；對話詳情頁尚未拉取與顯示草稿、一鍵送出（為 P1 前端）。 |
| webhook_events 重試 | 目前先落庫後同步處理；若需「失敗後依 webhook_events 重試」可再加 worker 或 cron。 |
| LINE_BOT_ENCRYPTION_KEY | 未設定時建立 bot 會 500；可於文件或設定頁說明必填。 |

---

## 附錄 A：Lint / Type-check / Build 結果

- **npm run lint**：通過（無錯誤）。
- **npm run type-check**：失敗。原因：`e2e/audit.spec.ts(125,7)` 型別不符（boolean | undefined 與 overload 參數）。此為既有 e2e 檔案，非本次 P0 變更範圍，未修改。
- **npm run build**：通過。Next.js 16.1.6 編譯成功，含新路由 `/api/contacts/[id]/suggestions`、`/api/settings/bots`、`/api/suggestions/[id]/send`、`/api/webhook/line/[botId]/[webhookKey]`。

---

（報告完）
