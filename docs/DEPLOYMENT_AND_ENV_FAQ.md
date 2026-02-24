# CustomerAIPro 部署與環境 FAQ

四端連通：**GitHub → Vercel → Supabase + Upstash Redis**。環境變數在本地用 `.env.local`，正式環境在 Vercel 後台設定。

---

## 1. 連通關係（一致且邏輯順序）

| 端 | 角色 | 說明 |
|----|------|------|
| **GitHub** | 程式碼來源 | Repo：`mason113074-cyber/chat`，主要分支 `main`。 |
| **Vercel** | 部署與託管 | 連線上述 GitHub repo，push `main` 即觸發 build + 部署。正式網址：www.customeraipro.com。 |
| **Supabase** | 資料庫與認證 | 專案建立於 Supabase，URL/Key 在 **Vercel 與本地** 都要設（見下方變數表）。 |
| **Upstash Redis** | 冪等／限流／快取 | **本機開發選用**；未設定時使用記憶體 fallback（單 instance 可運作；多 instance 建議必設）。**multi-bot production 必填**。 |

**邏輯流程**：程式碼在 GitHub → Vercel 從 GitHub 拉 main 建置並部署 → 建置／執行時讀取 Vercel 上的環境變數 → 後端連線 Supabase（必備）與 Upstash Redis（選用）。

---

## 2. 網址與 DNS

- **正式站**：https://www.customeraipro.com  
- **DNS**：指向 Vercel 專案（在 Vercel 後台綁定網域）。  
- **本機**：`npm run dev` → http://localhost:3000  

---

## 3. 環境變數（一覽）

以下變數名稱在 **.env.example**、**Vercel 後台**、**本機 .env.local** 中請保持一致。

| 用途 | 變數名稱 | 必填 | 說明 |
|------|----------|------|------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 匿名（公開）金鑰 |
| | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 服務角色金鑰（後端用） |
| **LINE** | `LINE_CHANNEL_SECRET` | 用 LINE 時 | Webhook 驗簽 |
| | `LINE_CHANNEL_ACCESS_TOKEN` | 用 LINE 時 | 發送訊息 |
| | `LINE_OWNER_USER_ID` | 用 LINE 時 | 綁定後台擁有者 |
| | `LINE_LOGIN_CHANNEL_ID` | 用 LINE 登入時 | LINE Login Channel ID（需在 LINE Developers 建立 Login channel） |
| | `LINE_LOGIN_CHANNEL_SECRET` | 用 LINE 登入時 | LINE Login Channel Secret |
| **站點（callback）** | `NEXT_PUBLIC_APP_URL` | 用 LINE 登入時 | 正式站請設為 https://www.customeraipro.com（OAuth callback 與登入後導向用） |
| **OpenAI** | `OPENAI_API_KEY` | ✅ | AI 回覆 |
| | `OPENAI_MONTHLY_BUDGET`、`OPENAI_TIMEOUT_MS` 等 | 選用 | 見 .env.example |
| **Upstash Redis** | `UPSTASH_REDIS_REST_URL` | **multi-bot production 必填** | **本機開發選用**；multi-bot production 必填（多 instance 下無 Redis 冪等僅限單機，系統輸出警告） |
| | `UPSTASH_REDIS_REST_TOKEN` | 同上 | 同上 |
| **LINE Webhook** | `LINE_WEBHOOK_LEGACY_ENABLED` | 選用 | 預設空（production 回 **410 Gone**）；設 `true` 可重新啟用 legacy `/api/webhook/line`（僅短期過渡用） |
| **站點** | `NEXT_PUBLIC_SITE_URL` | 建議 | 正式站設為 https://www.customeraipro.com |
| **Cron** | `HEALTHCHECK_CRON_SECRET` | 選用 | 健康檢查 cron 驗證 secret |
| | `WEBHOOK_CLEANUP_CRON_SECRET` | 建議 | Webhook 事件清理 cron 驗證 secret（見下方說明） |

- **本地**：複製 `.env.example` 為 `.env.local`，依上表填入（不要提交 .env.local）。  
- **Vercel**：專案 → Settings → Environment Variables，依上表新增（Production/Preview 依需求勾選）。  

---

## 4. Redis（Upstash）

- **程式**：`lib/cache.ts`、`lib/idempotency.ts`、`lib/rate-limit.ts` 讀取 **`UPSTASH_REDIS_REST_URL`**、**`UPSTASH_REDIS_REST_TOKEN`**。  
- **用途**：冪等、rate limit、快取；未設定時使用記憶體 fallback（單 instance 可運作）。  
- **multi-bot production 必填**：Vercel 多 instance 部署下，未設定 Upstash 將導致跨 instance 的冪等與 rate limit 失效。系統會在 Vercel Functions log 輸出 `[LINE webhook] Upstash Redis is not configured` 警告。  
- **設定處**：.env.example 有註解範例；Vercel 後台手動新增或透過 Upstash 整合；本機在 .env.local。  

> 專案**僅使用 Upstash Redis** 與上述兩個變數，沒有使用 Vercel KV 或 `KV_REST_API_*`。

---

## 4.1 LINE Webhook

- **multi-bot（正式 URL）**：`/api/webhook/line/{botId}/{webhookKey}`  
  - `botId`：`line_bots` 表的 UUID；`webhookKey`：建立 bot 時產生的 webhook key。  
  - Channel secret / access token 加密存於 DB（需設定 `LINE_BOT_ENCRYPTION_KEY`）。  
- **legacy endpoint** `/api/webhook/line`：  
  - 在 **production 預設回傳 410 Gone**（避免新人誤用舊設定）。  
  - 設定 `LINE_WEBHOOK_LEGACY_ENABLED=true` 可重新啟用（僅供舊版單 bot 短期過渡）。  
  - 本機開發（`NODE_ENV !== production`）不受影響，仍正常運作。  

---

## 5. 部署流程（無需手動 deploy 指令）

1. 程式碼 push 到 GitHub `main`。  
2. Vercel 自動觸發 build（`npm run build`）並部署。  
3. 環境變數在 Vercel 後台已設好即可（Supabase、LINE、OpenAI 必填；Upstash 選填）。  

`package.json` 沒有 `deploy` 指令；部署完全由 Vercel 從 GitHub 自動執行。

---

## 6. 連通檢查腳本

本機可驗證四端與環境變數是否正確：

```bash
npm run check-connections
```

會檢查：Vercel 環境、GitHub remote、Supabase 變數與 Auth 連線、Upstash 變數（若已設）與 REST 連線。

---

## 快速對照

| 項目 | 內容 |
|------|------|
| **GitHub** | mason113074-cyber/chat，分支 main |
| **Vercel** | 連線上述 repo，push main 即部署；正式站 www.customeraipro.com |
| **Supabase** | 必填三變數；本地 .env.local、正式 Vercel 後台 |
| **Upstash Redis** | 選填兩變數；同上；未設則記憶體 fallback |

---

## 7. Webhook 事件留存（Retention）與自動清理

`webhook_events` 表保存 LINE webhook 的原始 payload（`raw_body`）。為避免資料庫膨脹與 PII 長期留存，系統實作定期清理機制。

### 留存策略

| 狀態 | 保留天數 | 說明 |
|------|---------|------|
| `processed` | 7 天 | 已成功處理的事件 |
| `failed` | 30 天 | 處理失敗（保留供除錯） |
| `pending` | 1 天 | 待處理（正常狀況應很快被標為 processed/failed） |

### Cron 設定

清理 cron 在 `vercel.json` 設定為每日 UTC 03:00 執行：

```
GET /api/cron/cleanup-webhook-events
Authorization: Bearer <WEBHOOK_CLEANUP_CRON_SECRET>
```

Vercel 會自動帶上正確 header 呼叫此路由（需在 Vercel 後台設定 `WEBHOOK_CLEANUP_CRON_SECRET`）。

### 手動觸發清理

```bash
curl -X GET https://www.customeraipro.com/api/cron/cleanup-webhook-events \
  -H "Authorization: Bearer <WEBHOOK_CLEANUP_CRON_SECRET>"
```

- 未帶 secret 或 secret 不符時，回傳 `401 Unauthorized`。
- 成功時回傳 JSON，包含各狀態已刪除筆數。
