# CustomerAIPro Runbook — 維運與設定清單

本文件為「上線前檢查」與「第三方服務 callback / redirect URL」的單一來源，避免漏設或錯設。

---

## 一、Callback / Redirect URL 清單

部署或變更網域時，請在以下服務後台確認並填入對應 URL。

### 1. LINE Login（LINE Developers Console）

**用途**：LINE 登入 / 綁定 LINE 的 OAuth callback。

| 設定項 | 值（正式環境） |
|--------|----------------|
| **Callback URL** | `https://www.customeraipro.com/api/auth/line/callback` |

- **說明**：程式內 `redirect_uri` 由 `NEXT_PUBLIC_APP_URL` 組成，即 `${NEXT_PUBLIC_APP_URL}/api/auth/line/callback`。正式站請設 `NEXT_PUBLIC_APP_URL=https://www.customeraipro.com`。
- **程式位置**：`app/api/auth/line/route.ts`、`app/api/auth/line/callback/route.ts`。

---

### 2. Supabase Auth（Supabase Dashboard）

**用途**：Magic link、密碼重設、Email 確認等導向。

**Site URL（單一）**

| 設定項 | 建議值 |
|--------|--------|
| **Site URL** | `https://www.customeraipro.com` |

**Redirect URLs（需全部加入）**

| URL | 用途 |
|-----|------|
| `https://www.customeraipro.com/zh-TW/dashboard` | 登入 / Magic link 成功後導向 |
| `https://www.customeraipro.com/en/dashboard` | 同上（英文） |
| `https://www.customeraipro.com/zh-TW/login` | 登出、錯誤、忘記密碼完成後導向 |
| `https://www.customeraipro.com/en/login` | 同上（英文） |

- 若 Supabase 支援萬用，可改為：`https://www.customeraipro.com/**`（仍建議至少保留上列四條）。
- **程式位置**：`app/api/auth/line/callback/route.ts`（`redirectTo`）、`app/[locale]/forgot-password/page.tsx`（`redirectTo`）。

---

### 3. LINE Messaging API Webhook（多 Bot）

**用途**：LINE 官方帳號接收訊息與事件。

| 設定項 | 值（每個 Bot 不同） |
|--------|----------------------|
| **Webhook URL** | `https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}` |

- `botId`：Dashboard → 設定 → Bots 中該 Bot 的 ID（UUID）。
- `webhookKey`：建立 Bot 時產生的 key；後台僅顯示部分，完整 key 需從建立當下保存。
- **說明**：見 `docs/DEPLOYMENT_AND_ENV_FAQ.md` 的 LINE Webhook 一節；legacy `/api/webhook/line` 在 production 預設 410。

---

## 二、Production 上線檢查清單

部署到 **https://www.customeraipro.com** 前，請逐項確認。

### 環境變數（Vercel）

- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.customeraipro.com`（無尾端斜線）
- [ ] `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 已設且為正式 Supabase 專案
- [ ] `OPENAI_API_KEY` 已設
- [ ] LINE 相關：若使用 LINE 登入，已設 `LINE_LOGIN_CHANNEL_ID`、`LINE_LOGIN_CHANNEL_SECRET`；若使用 Messaging，已設對應 channel secret / token 或使用多 Bot（DB + `LINE_BOT_ENCRYPTION_KEY`）
- [ ] **Multi-bot / 多 instance 必填**：`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`（未設時 webhook 在 production 會將事件標為 failed 並回 200，避免 LINE 重試暴量，但事件不會被處理）
- [ ] `WEBHOOK_CLEANUP_CRON_SECRET` 已設（建議，供 `/api/cron/cleanup-webhook-events` 驗證）

### 第三方後台

- [ ] **LINE Login**：Callback URL 已設為 `https://www.customeraipro.com/api/auth/line/callback`
- [ ] **Supabase Auth**：Site URL 與 Redirect URLs 已依「一、2」設定
- [ ] **LINE Messaging**：各 Bot 的 Webhook URL 為 `https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}`

### 監控與維運

- [ ] Vercel 已綁定網域 `www.customeraipro.com`，HTTPS 正常
- [ ] 若有使用 Cron：`vercel.json` 內 `/api/health-check`、`/api/cron/cleanup-webhook-events` 已生效；cleanup 的 Authorization header 使用 `WEBHOOK_CLEANUP_CRON_SECRET`
- [ ] 建議對 log 中 `[LINE webhook] Upstash Redis is not configured` 與 webhook_events 的 `status: 'failed'` 設告警（Vercel Logs 或外部監控）

### 程式與 CI

- [ ] 從 main 部署；CI（type-check / lint / unit / build）全綠
- [ ] 無將測試用 API（如舊的 test-ai / test-alert）暴露在 production 的設定

---

## 三、常用指令與路徑

| 用途 | 指令或路徑 |
|------|------------|
| 本機連通檢查 | `npm run check-connections` |
| 手動觸發 webhook 清理 | `curl -X GET https://www.customeraipro.com/api/cron/cleanup-webhook-events -H "Authorization: Bearer <WEBHOOK_CLEANUP_CRON_SECRET>"` |
| 環境變數說明 | `.env.example`、`docs/DEPLOYMENT_AND_ENV_FAQ.md` |
| 深度改善建議 | `docs/DEEP_DIVE_IMPROVEMENTS.md` |
| 安全政策 | `SECURITY.md` |

---

*與 NOTION_SYNC.md、DEPLOYMENT_AND_ENV_FAQ.md 同步維護；網域變更時請一併更新本 Runbook。*
