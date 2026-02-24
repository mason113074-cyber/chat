# 補充報告：AI 副駕優先與多租戶多 Bot 缺口

**依據**：`docs/REPORTS/PROJECT_FULL_AUDIT.md`  
**目標**：(1) 如何改成「AI 副駕優先（B/B/B）」— 混合自動 + 人工一鍵送出 + 高風險模板優先；(2) 如何改成真正多租戶多 LINE bot。  
**限制**：本報告僅分析與設計提案，不修改任何程式碼；具體檔案位置與建議修改點僅供實作參考。

---

## 1) 副駕決策矩陣（表格）

以下矩陣對應「類別 × sourcesCount × confidence → action」，並對照現況程式碼路徑。  
**類別**與現況的對應方式：目前程式沒有「意圖分類」欄位，僅以**敏感詞風險等級**（高/中/低）與 **sources/confidence** 決定行為；下表「類別」為產品語意，實際對應來自 `lib/security/sensitive-keywords.ts` 的 HIGH_RISK / MEDIUM_RISK 與一般輸入。

| 類別 | sourcesCount | confidence | 建議 action | 現況程式碼路徑（檔案 + 行號區間） |
|------|--------------|------------|-------------|-----------------------------------|
| 低風險 FAQ | >0 | 高 | AUTO | 主流程：通過敏感詞、無低信心覆寫 → `replyMessage(replyToken, finalReply)`。`app/api/webhook/line/route.ts` 約 534–566 行（confidence ≥ threshold 時不改 finalReply，562 行送出）。 |
| 低風險 FAQ | >0 | 低 | SUGGEST 或 ASK | 現況為 HANDOFF 或 append_disclaimer：`route.ts` 543–548 行，`lowConfidenceAction === 'handoff'` 則 finalReply 改為 handoff_message，否則 append 免責；然後 562 行**仍直接送出**，無草稿。 |
| 低風險 FAQ | 0 | 高 | ASK 或 SUGGEST | 現況：sources=0 會拉低 confidence（`lib/confidence.ts`）；若仍 ≥ threshold 則 562 行直接 AUTO 送出；無「僅建議不送」選項。 |
| 低風險 FAQ | 0 | 低 | HANDOFF | 同上，543–548 行 handoff 或 disclaimer 後 562 行送出。 |
| 訂單查詢 | 視關鍵字 | — | 建議 SUGGEST/ASK | 若未命中敏感詞則走主流程（同低風險 FAQ）。若未來訂單相關列為中風險，現況會走「敏感詞 block」：`route.ts` 252–281 行，回覆 SENSITIVE_CONTENT_REPLY（HANDOFF 行為）。 |
| 退款退貨 / 折扣價格 | — | — | HANDOFF（模板優先） | 屬 HIGH_RISK（`sensitive-keywords.ts` 7–19 行）。現況：`route.ts` 252–281 行，不呼叫 AI，直接 `replyMessage(replyToken, SENSITIVE_CONTENT_REPLY)` 並 return。**已是固定模板、不發送 AI 文本**。 |
| 運費到貨 | 多為 >0 或 0 | 高/低 | AUTO 或 SUGGEST | 現況無獨立分類，走一般主流程；若知識庫有則可能 AUTO。 |
| 客訴 | — | — | HANDOFF（模板優先） | 屬 MEDIUM_RISK（`sensitive-keywords.ts` 22–28 行）。現況與高風險相同：252–281 行，回覆 SENSITIVE_CONTENT_REPLY 並 return。**已是固定模板**。 |
| 其他（未命中敏感詞） | >0 | 高 | AUTO | 同「低風險 FAQ >0 高」：`route.ts` 534–566。 |
| 其他 | 0 或 >0 | 低 | HANDOFF / append | 同「低風險 FAQ 低信心」：543–548 後 562 送出。 |

**摘要**：

- **AUTO**：現況僅「低風險 + 通過敏感詞 + confidence ≥ threshold」且未觸發 guardrail 時，在 **`app/api/webhook/line/route.ts` 562 行** 直接 `replyMessage(replyToken, finalReply)`。
- **HANDOFF（固定模板）**：高風險/中風險敏感詞在 **252–281 行** 回覆 `SENSITIVE_CONTENT_REPLY`；自訂敏感詞在 **393–399 行** 回覆 `sensitiveWordReply || SENSITIVE_CONTENT_REPLY`；低信心 handoff 在 **543–545 行** 將 finalReply 改為 `handoff_message` 後仍由 562 行送出。
- **SUGGEST**：現況**不存在**。沒有「只存草稿、不發 LINE」的路徑；低信心時要麼改文案後照樣送出，要麼 append 免責後送出。
- **模板優先**：高風險/中風險已用固定句（模板）；尚未有「依類別選不同模板」或「可後台編輯的模板表」。

---

## 2) 目前「會直接對客人發送 AI 文本」的所有路徑

以下僅列**會對 LINE 使用者發送訊息**的程式路徑；`/api/chat` 只回傳 JSON 給呼叫端，不發送給客人，故不列為「對客人發送」。

| 路徑 | 說明 | 是否會直接對客人發送 AI 生成文本？ | 能否關閉？ | 是否有 guardrails？ | 是否模板優先？ |
|------|------|-------------------------------------|------------|---------------------|----------------|
| **LINE Webhook 主流程** | 文字訊息 → 敏感詞通過 → 用量/聯絡人/設定 → 無 workflow 觸發 → RAG → generateReply → FORBIDDEN_PATTERNS + 長度 → 信心門檻 → 延遲 → replyMessage(finalReply) | **是**（562 行送出 finalReply，為 AI 生成經 guardrail 後內容） | 可藉「關閉自動回覆」設定或改為 SUGGEST 模式關閉自動送；目前無此開關 | 有：輸入敏感詞、FORBIDDEN_PATTERNS、output filter、信心門檻 | 僅低信心時改為 handoff_message；高風險在更早階段用固定句，不進此段 |
| **LINE Webhook — 高/中風險敏感詞** | 252–281 行：detectSensitiveKeywords 非 low → replyMessage(SENSITIVE_CONTENT_REPLY) | 否（固定模板句） | 無法關閉此回覆（否則客人無回應）；可改為僅寫 DB 不送，需產品決定 | 有（輸入即擋，不呼叫 AI） | 是（單一固定句，可擴為依類別模板） |
| **LINE Webhook — 自訂敏感詞** | 393–399 行：customSensitiveWords 命中 → replyMessage(sensitiveWordReply \|\| SENSITIVE_CONTENT_REPLY) | 否（設定或固定模板） | 可關閉自訂敏感詞清單或改為 SUGGEST | 有 | 是（可後台填 sensitive_word_reply） |
| **LINE Webhook — 營業時間外** | 416–427 行：outsideHoursMode 為 auto_reply / collect_info → replyMessage(outsideHoursMessage 或固定句) | 否（固定/設定文案） | 可關閉營業時間或改為不自動回 | 不涉及 AI | 是 |
| **LINE Webhook — 歡迎訊息** | 128–148 行：follow 事件 → replyMessage(settings.welcome_message) | 否 | 可關閉 welcome_message_enabled | 不涉及 AI | 是 |
| **LINE Webhook — 滿意度回覆** | 165 行：postback feedback → replyMessage(感謝回饋) | 否 | 可關閉 feedback | 不涉及 AI | 是 |
| **LINE Webhook — 圖/貼圖/位置** | 186, 200, 214 行：固定回覆 | 否 | 可改文案 | 不涉及 AI | 是 |
| **LINE Webhook — 限流/額度/錯誤** | 245, 286, 298, 629 行：固定回覆 | 否 | 僅能調整文案或錯誤時不送 | 不涉及 AI（629 為錯誤 fallback） | 是 |
| **LINE Webhook — 滿意度 push** | 592 行：pushMessage 滿意度模板 | 否 | 可關閉 feedback_enabled | 不涉及 AI | 是 |
| **Workflow 執行 — send_message / quick_reply** | `lib/workflow-engine.ts` 201–218 行：executeActionNode 依 node.data?.message 送出 | 否（節點設定之固定文案；AI 節點僅寫入 ctx.variables.ai_reply，目前無節點把 ai_reply 當訊息送出） | 可關閉該 workflow 或該節點 | 工作流文案為人工設定 | 是（節點模板） |
| **Workflow 執行 — to_human** | `lib/workflow-engine.ts` 243–251 行：replyMessage(handoffMsg) | 否（固定 handoff 句） | 可改文案 | 不涉及 AI | 是 |
| **人工一鍵送出** | `app/api/conversations/[id]/reply/route.ts`：pushMessage(contact.line_user_id, message) | 否（人工輸入，非 AI 生成） | 不適用 | 不適用 | 不適用 |

**結論**：  
- **會直接對客人發送「AI 生成」文本的，只有一條路徑**：**LINE Webhook 主流程** 中 `app/api/webhook/line/route.ts` 約 **562 行**的 `replyMessage(replyToken, finalReply)`（finalReply 來自 generateReply + guardrail + 信心覆寫）。  
- 其餘皆為固定/設定文案或人工輸入；Workflow 的 send_message 送的是節點設定的 message，不是即時 AI 輸出。

---

## 3) SUGGEST 草稿落地：DB / 後端 / 前端最小改動方案

### 3.1 DB

**方案 A：新表 `ai_suggestions`（建議）**

- **用途**：專存「AI 建議草稿」，與已送出的 conversation 分離，方便查詢「待審」、過期、以及稽核「誰在何時送出」。
- **建議欄位**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK |
| contact_id | uuid | FK → contacts(id) |
| user_id | uuid | FK → users(id)，tenant |
| event_id | text | 冪等用（webhook event id），可 unique |
| user_message | text | 客人原文 |
| suggested_reply | text | AI 建議內容 |
| sources_count | int | 知識庫命中條數 |
| confidence_score | float | 信心分數 |
| risk_category | text | 可選：low / medium / high（來自敏感詞或未來意圖） |
| status | text | draft \| sent \| expired \| rejected |
| sent_at | timestamptz | 若 status=sent |
| sent_by | uuid | 若 status=sent，寫入審核者 user_id（或 system 表示自動送出） |
| created_at | timestamptz | 建立時間 |
| expires_at | timestamptz | 可選，草稿逾時不再可送 |

- **RLS**：`auth.uid() = user_id`，與現有 conversations/contacts 一致。

**方案 B：conversations 增加 draft meta**

- 在 `conversations` 增加一筆 role=assistant、且僅為「草稿」的列，用 meta 區分（例如 `meta->>'is_draft' = 'true'`，或獨立欄位 `is_draft boolean`、`draft_sent_at`、`draft_sent_by`）。
- **優點**：不需新表，時間軸與對話同一表。  
- **缺點**：conversations 查詢需常過濾 draft；「待審列表」需額外索引；稽核「送出行為」需另記 sent_by/sent_at（可放在 meta 或新欄）。

**建議**：以**方案 A（ai_suggestions）**為主，關係清楚、待審列表與稽核簡單；若希望「草稿也出現在對話氣泡」再於前端依 contact_id + event_id 關聯顯示。

### 3.2 後端

- **Webhook 行為**（`app/api/webhook/line/route.ts`）：  
  - 在「決定要送 finalReply」前，依策略（例如 risk_category=medium 或 confidence < 某門檻）改為 **SUGGEST**：不呼叫 `replyMessage(replyToken, finalReply)`，改為寫入 `ai_suggestions`（status=draft），並可選擇是否先 `replyMessage(replyToken, '您的訊息已收到，專人將盡快回覆。')` 或靜默不送。  
  - 需傳入的資料：contact_id, user_id, event_id, user_message, suggested_reply, sources_count, confidence_score, risk_category；expires_at 可設為 now + 例如 24h。
- **新增 API**（建議）：  
  - **GET /api/contacts/[id]/suggestions** 或 **GET /api/conversations/suggestions?contact_id=**：列出該聯絡人（或當前 user 的）status=draft 的建議，供對話詳情頁顯示。  
  - **POST /api/conversations/[id]/reply**（沿用）：擴充 body 可接受 `{ "message": "...", "suggestion_id": "uuid" }`。若帶 `suggestion_id`，則：  
    - 驗證 suggestion 屬於該 contact、user、且 status=draft、未過期；  
    - 呼叫 `pushMessage(contact.line_user_id, { type: 'text', text: message })`（與現有一鍵送出相同）；  
    - 寫入 conversation（role=assistant, resolved_by=human）；  
    - 更新 ai_suggestions：status=sent, sent_at=now(), sent_by=auth.uid()。  
  - 或 **POST /api/suggestions/[id]/send**：專門「審核通過並送出」草稿，內部再呼叫 pushMessage + insertConversationMessage + 更新 suggestion。
- **沿用**：`POST /api/conversations/[id]/reply` 現有「純人工輸入」路徑不變，僅多一個「從草稿送出」的參數與分支。

### 3.3 前端

- **對話詳情頁**（`app/[locale]/dashboard/conversations/[contactId]/page.tsx` 與 `ConversationPanel`）：  
  - 進入對話時多拉一筆 **GET /api/contacts/[id]/suggestions**（或 /conversations/suggestions?contact_id=）。  
  - 若有 status=draft 的建議：在對話區以**明顯區塊**顯示「AI 建議回覆」草稿（suggested_reply）、信心分數（可選）、「一鍵送出」按鈕與「捨棄」按鈕。  
  - 一鍵送出：呼叫 **POST /api/conversations/[id]/reply** 帶 `{ "suggestion_id": "..." }` 或 **POST /api/suggestions/[id]/send**；成功後更新本地列表、將該草稿標為已送出並從待審區移除。  
- **稽核欄位**：  
  - 在「已送出」的 conversation 或 ai_suggestions 上顯示：**送出來源**（human_compose / human_approved_suggestion）、**若為建議則 suggestion_id**、**sent_by**（user_id 或顯示名稱）、**sent_at**。  
  - 若用 ai_suggestions 表：sent_by、sent_at 已存於該表；conversations 可選在 meta 或擴充欄位記 `approved_from_suggestion_id`，方便報表與稽核。

---

## 4) 多租戶多 Bot 設計（須可驗簽）

### 4.1 Webhook URL 設計

- **建議**：`/api/webhook/line/[botId]/[webhookKey]`  
  - `botId`：對應單一 LINE bot（頻道）的邏輯 ID，例如 UUID 或 slug。  
  - `webhookKey`：每個 bot 一組隨機字串（僅用於 URL，不參與簽章），用來在**驗簽前**從 DB 查出對應 bot 列，再取該 bot 的 channel_secret 做驗簽。  
- **理由**：LINE 只送 x-line-signature + body，不送 channel id；必須在驗簽前就鎖定「哪個 bot」，用 URL path 的 botId + webhookKey 查表取得 channel_secret，才能用正確的 secret 驗簽。

### 4.2 Tenant / Bot 資料表建議

- **表名**：`line_bots`（或 `channel_bots`）。  
- **建議欄位**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | PK（即 bot_id） |
| user_id | uuid | FK → users(id)，租戶 |
| name | text | 顯示名稱（例如「官方帳號 A」） |
| channel_id | text | LINE 後台 channel ID（可選，方便對帳） |
| webhook_key_hash | text | webhookKey 的 hash（例如 SHA-256），用於查詢；URL 只帶明文 webhook_key，查表時 hash 比對 |
| encrypted_channel_secret | text | 加密後的 LINE channel secret，驗簽時解密使用 |
| encrypted_channel_access_token | text | 加密後的 LINE access token，發 reply/push 時解密使用 |
| destination | text | 可選，LINE webhook body 的 destination，若有多 bot 可再對應 |
| is_active | boolean | 是否啟用 |
| created_at, updated_at | timestamptz | |

- **RLS**：`auth.uid() = user_id`，僅租戶本人可 CRUD 自己的 bot。  
- **查詢**：收到 POST `/api/webhook/line/[botId]/[webhookKey]` 時，以 botId 查 `line_bots`，並以 webhook_key_hash 與傳入 webhookKey 的 hash 比對，取得該列後解密 channel_secret 做驗簽。

### 4.3 驗簽流程（驗簽前如何定位 bot）

1. **Route 解析**：從 path 取得 `botId`、`webhookKey`（例如 Next.js dynamic route `app/api/webhook/line/[botId]/[webhookKey]/route.ts`）。  
2. **查表**：`SELECT * FROM line_bots WHERE id = :botId AND is_active = true`；對該列用同一 hash 演算法算 `hash(webhookKey)`，與 `webhook_key_hash` 比對。若無列或 hash 不符，回 404 或 401，**不讀 body 做驗簽**（避免資訊洩漏）。  
3. **取 secret**：從該列讀 `encrypted_channel_secret`，用應用層金鑰解密得到 `channel_secret`。  
4. **驗簽**：與現有邏輯相同，`validateSignature(body, signature, channel_secret)`（需將 `lib/line.ts` 改為可傳入 secret 參數，而非僅讀 process.env）。  
5. **後續**：用該列的 `user_id` 作為 tenant（ownerUserId），並用解密的 `channel_access_token` 呼叫 LINE API（replyMessage / pushMessage 需改為可傳入 token 或 bot 列）。

### 4.4 Secret / Token 加密儲存

- **原則**：DB 不存明文；加密金鑰不進版控、僅在 runtime 環境（env 或 secrets manager）提供。  
- **建議**：  
  - 使用 **AES-256-GCM**（或 Supabase Vault / 雲端 KMS）對 `channel_secret`、`channel_access_token` 加密後存進 `encrypted_channel_secret`、`encrypted_channel_access_token`。  
  - 應用層金鑰：例如 `LINE_BOT_ENCRYPTION_KEY`（32 bytes for AES-256）由 env 注入；或使用 Supabase Vault 的 key 做 encrypt/decrypt。  
  - 寫入時：建立/更新 bot 時，用 encryption key 加密再寫入；讀取時僅在 Webhook 或送 LINE 的瞬間解密，用完不保留於記憶體過久。  
- **webhook_key**：URL 中的 webhookKey 不參與 LINE 簽章，僅用於查 bot；存 DB 時存 hash（例如 SHA-256），比對時用相同 hash 即可，無需可逆。

---

## 5) Webhook 錯誤策略改造建議（兩種方案對照）

### 方案 A：重大錯誤回 5xx，讓 LINE 重試（依 idempotency 防重）

- **作法**：在 Webhook 頂層或 handleEvent 內，區分「可重試錯誤」（如 DB 暫時不可用、OpenAI timeout）與「不可重試錯誤」（如驗簽失敗、body 格式錯誤）。可重試錯誤回 **503**（或 500），其餘仍回 200。  
- **優點**：LINE 會依規格重試，不需自建 queue；實作簡單。  
- **缺點**：重試間隔與次數由 LINE 決定；若 idempotency 有漏洞可能重複處理；5xx 過多可能觸發 LINE 告警或限流。

### 方案 B：永遠回 200，先將 raw event 落 DB/queue，後續由內部重試

- **作法**：收到 POST 後，驗簽通過即 **先寫入**「webhook_events」表或送入佇列（payload = raw body + signature + 收到時間），隨即回 200。另由 background worker 或 cron 從表/佇列取事件，執行現有 handleEvent 邏輯；失敗則重試（指數退避）、並可標記失敗原因與次數。  
- **優點**：不依賴 LINE 重試；重試策略、延遲、死信可自控；與現有「回 200 吞錯」相比，事件不丟失。  
- **缺點**：需新增表/佇列與 worker，維運與部署較複雜；replyToken 有有效期，延遲過久可能無法 reply，僅能 push。

**推薦**：**方案 B**。  
理由：(1) 現況已「永遠 200」且 idempotency 存在，改為 5xx 會改變 LINE 行為且仍有重試不可控問題；(2) 方案 B 保留「先 200 再處理」的語意，事件不丟失、重試可控；(3) 長期可將「生成回覆」改為非同步，減輕 Webhook 延遲與 timeout。實作時需注意 replyToken 有效期（建議數秒內完成 reply），其餘可走 push 或僅寫 DB 待人工處理。

---

## P0 改動清單（10 項，含檔案位置與原因）

| # | 改動摘要 | 檔案位置 | 原因 |
|---|----------|----------|------|
| 1 | 多租戶：新增 line_bots 表與 migration，含 webhook_key_hash、encrypted_channel_secret、encrypted_channel_access_token | 新增 `supabase/migrations/029_line_bots.sql` | 多 bot 須 per-tenant 存 secret/token，且不可明文 |
| 2 | Webhook 路由改為動態：/api/webhook/line/[botId]/[webhookKey]，並在驗簽前依 botId + webhookKey 查 line_bots | 新增 `app/api/webhook/line/[botId]/[webhookKey]/route.ts`（或移轉現有 route） | 驗簽前必須鎖定 bot 才能用對的 secret |
| 3 | 驗簽與 LINE 呼叫改為可傳入 secret/token：validateSignature(body, signature, channelSecret)、replyMessage/pushMessage 接受 token 或 bot 列 | `lib/line.ts` | 多 bot 不能再用全域 env，須依 bot 列動態取得 |
| 4 | Webhook 內 ownerUserId、LINE 客戶端來源改為從 line_bots 的 user_id 與解密後 token 取得 | `app/api/webhook/line/route.ts`（或新動態 route） | 租戶與發送 API 須對應到正確 bot |
| 5 | 副駕 SUGGEST：Webhook 主流程在「送出前」依策略（如 confidence < 門檻或 risk=medium）寫入 ai_suggestions 且不呼叫 replyMessage | `app/api/webhook/line/route.ts` 約 534–566 行一帶 | 要實現「僅建議、不自動送」必須有分支與寫入草稿 |
| 6 | 新增 ai_suggestions 表與 RLS | 新增 migration（例如 `030_ai_suggestions.sql`） | 草稿與稽核需持久化與隔離 |
| 7 | 新增「取得草稿」與「審核送出」API（GET suggestions、POST reply 帶 suggestion_id 或 POST suggestions/[id]/send） | 新增/擴充 `app/api/contacts/[id]/suggestions` 或 `app/api/conversations/...`、`app/api/suggestions/[id]/send/route.ts` | 前端需 API 才能顯示草稿與一鍵送出 |
| 8 | 錯誤策略：Webhook 改為「驗簽後先寫入 webhook_events 再回 200」，或接 queue | `app/api/webhook/line/route.ts` 頂層 + 新增表/佇列 | 不丟事件、可內部重試，避免永遠吞錯 |
| 9 | 設定頁：LINE 頻道改為「多 bot 管理」— 建立 bot 時寫入 line_bots、產生 webhook URL（含 webhookKey）、加密儲存 secret/token | `app/[locale]/dashboard/settings/page.tsx` 及相關 API（如 `/api/settings/line`、新增 `/api/settings/bots`） | 營運端須能新增/編輯 bot 並取得 webhook URL |
| 10 | 加密/解密 helper：以 ENCRYPTION_KEY 對 channel_secret、channel_access_token 做 AES-256-GCM，寫入/讀取 line_bots 時使用 | 新增 `lib/encrypt.ts`（或同目錄）並在寫入/讀取 bot 處呼叫 | 避免 DB 明文存 token/secret |

---

## P1 改動清單（10 項，含檔案位置與原因）

| # | 改動摘要 | 檔案位置 | 原因 |
|---|----------|----------|------|
| 1 | 副駕決策可配置：設定新增「依類別/信心/sources 的 action 矩陣」或開關（如「中風險改 SUGGEST」） | `app/api/settings/route.ts`、users 或 settings 表、`app/api/webhook/line/route.ts` | 不同商家可選 AUTO/SUGGEST/HANDOFF 策略 |
| 2 | 高風險模板可後台編輯：依類別（退款、客訴等）選模板或共用「敏感詞回覆」模板 | `lib/security/sensitive-keywords.ts` 或設定表、`app/api/webhook/line/route.ts` 252–281、393–399 | 模板優先且可營運調整 |
| 3 | 對話詳情頁：拉取 suggestions、顯示草稿區與一鍵送出/捨棄 | `app/[locale]/dashboard/conversations/[contactId]/page.tsx`、`ConversationPanel.tsx` | 副駕 SUGGEST 需前端呈現與操作 |
| 4 | 稽核：conversations 或 ai_suggestions 顯示 sent_by、sent_at、approved_from_suggestion_id | `app/[locale]/dashboard/conversations/` 對話列表與詳情、相關 API 回傳欄位 | 合規與爭議追蹤 |
| 5 | idempotency key 納入 botId：同一 event 不同 bot 不共用 key | `lib/idempotency.ts`、Webhook 呼叫處 | 多 bot 時 event id 可能重複，需 per-bot 隔離 |
| 6 | Rate limit 納入 bot 或 tenant：避免單一聯絡人跨 bot 共用同一限流 | `lib/rate-limit.ts`、Webhook 呼叫處 | 多租戶公平性與防濫用 |
| 7 | Workflow 執行時使用「當前 bot」的 token：WorkflowEngine 需能取得 line bot 的 token | `lib/workflow-engine.ts`、呼叫 replyMessage 處；`lib/line.ts` | 多 bot 下 workflow 須對正確頻道發送 |
| 8 | 舊版單一 Webhook URL 相容：若保留 /api/webhook/line（無 botId），則從 env 讀取單一 LINE_* 並對應到預設 bot 或單一 tenant | `app/api/webhook/line/route.ts`（保留一層或 redirect） | 升級時不中斷既有設定 |
| 9 | 監控告警：Webhook 寫入 webhook_events 失敗、或處理失敗次數過高時告警 | 新 worker 或 cron、Sentry/Logging | 方案 B 落地後可觀測性 |
| 10 | 單元/整合測試：多 bot 查表與驗簽、SUGGEST 寫入與送出、加密 helper | 新增 `lib/__tests__/encrypt.test.ts`、e2e 或 API 測試 | 重構與多租戶正確性 |

---

（報告完）
