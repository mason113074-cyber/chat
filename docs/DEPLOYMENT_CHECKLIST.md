# 部署清單（Vercel + Supabase）

## 1. 環境變數分層

Vercel 的 Environment Variables 需依環境分開：

| 變數 | Production | Preview | 說明 |
|------|-----------|---------|------|
| `LINE_BOT_ENCRYPTION_KEY` | 正式金鑰 | 測試用金鑰 | 加密 Bot 憑證用，兩環境**必須不同** |
| `UPSTASH_REDIS_REST_URL` | 正式 Redis | 測試 Redis | 冪等/限流/快取 |
| `UPSTASH_REDIS_REST_TOKEN` | 正式 Token | 測試 Token | |
| `OPENAI_API_KEY` | 正式 Key | 可共用或測試用 | |
| `NEXT_PUBLIC_SUPABASE_URL` | 正式專案 | 可共用 | |
| `SUPABASE_SERVICE_ROLE_KEY` | 正式 Key | 測試 Key | |

**驗收**：在 Vercel Dashboard → Settings → Environment Variables 確認 Production 與 Preview 各有獨立值。

---

## 2. Webhook 路由不被 Cache

確保 `/api/webhook/line/...` 不被 Vercel CDN 快取：

- `proxy.ts` 已將 `/api/webhook/` 列為公開 API（直接放行），不經過 next-intl middleware。
- API Route 預設為 dynamic（Next.js App Router 的 POST handler 不會被 cache）。
- **驗收**：用 `curl -v POST` 打 webhook URL，確認回應標頭無 `x-vercel-cache: HIT`。

---

## 3. RLS 核對

所有 20 張表都已啟用 RLS（Supabase Dashboard 可確認）。

關鍵 policy 規則：
- `users`：`auth.uid() = id`
- `contacts`：`auth.uid() = user_id`
- `conversations`：透過 `contact_id` 關聯到 `contacts.user_id`
- `knowledge_base`：`auth.uid() = user_id`
- `line_bots`：`auth.uid() = user_id`
- `ai_suggestions`：透過 `contact_id` 關聯
- `webhook_events`：service_role only（bot_id 關聯）

**驗收**：在 Supabase Dashboard → Authentication → Policies 確認每張表都有至少一條 SELECT/INSERT/UPDATE policy，且條件含 `auth.uid()`。

---

## 4. Production 必須有 Redis

程式碼中 `app/api/webhook/line/[botId]/[webhookKey]/route.ts` 已在 production 且無 Redis 時拒絕處理（標記 webhook_events 為 failed）。

**驗收**：
- 確認 Vercel Production 環境有 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`。
- 在 Upstash Dashboard 確認 Redis 實例正常。

---

## 5. 安全標頭

`proxy.ts` 已加入：X-Frame-Options、X-Content-Type-Options、Referrer-Policy、CSP、HSTS（production）。

**待改善**：CSP 仍含 `unsafe-inline`/`unsafe-eval`（配合 Next/React），後續可改用 nonce 或 strict-dynamic。
