# Integrations & MCP Connection Check

Checked: codebase + env contract. Use this to verify all integrations and Cursor MCP are correctly wired.

---

## 1. Integrations Overview

| Integration | Purpose | Env vars | Code entry points | Status |
|-------------|---------|----------|-------------------|--------|
| **Supabase** | Auth, DB, server client | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/auth-helper.ts`, `proxy.ts` | ✅ Wired |
| **LINE** | Messaging, webhook | `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_OWNER_USER_ID` | `lib/line.ts`, `app/api/webhook/line/route.ts`, `app/api/line/verify/route.ts` | ✅ Wired |
| **OpenAI** | AI replies, usage | `OPENAI_API_KEY`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `OPENAI_MONTHLY_BUDGET` | `lib/openai.ts`, `lib/openai-usage.ts`, `app/api/test-ai/route.ts` | ✅ Wired |
| **Upstash Redis** | Cache, idempotency, rate limit | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `lib/cache.ts`, `lib/idempotency.ts`, `lib/rate-limit.ts` | ✅ Wired (optional; fallback in-memory) |
| **Vercel** | Hosting / deploy | (build env) | — | ✅ Deploy from GitHub main |

---

## 2. Integration Details

### Supabase
- **Auth**: `proxy.ts` uses `createServerClient` for session refresh and redirects (login, onboarding).
- **Server/client**: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase.ts` (admin, helpers).
- **Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; server-side features need `SUPABASE_SERVICE_ROLE_KEY`.

### LINE
- **Webhook**: `POST /api/webhook/line` — validates signature, idempotency, rate limit, then handles events (reply, DB, knowledge search).
- **Verify**: `app/api/line/verify/route.ts` — calls LINE Bot API for channel info.
- **Required**: `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`; owner linking uses `LINE_OWNER_USER_ID`.

### OpenAI
- **Chat**: `lib/openai.ts` — lazy client, uses `OPENAI_API_KEY`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`.
- **Usage/budget**: `lib/openai-usage.ts` — `OPENAI_MONTHLY_BUDGET` (USD/month).
- **Test API**: `app/api/test-ai/route.ts` — uses same key.

### Upstash Redis
- **Cache**: `lib/cache.ts` — `getCached` / `setCached`; JSON + primitive fallback.
- **Idempotency**: `lib/idempotency.ts` — LINE webhook event dedup by key + TTL.
- **Rate limit**: `lib/rate-limit.ts` — LINE webhook per-identifier 60s window.
- **Optional**: If `UPSTASH_REDIS_*` are unset, in-memory fallback is used (fine for single instance).

### Site URL
- **`NEXT_PUBLIC_SITE_URL`**: Used for redirects / links (e.g. OAuth, emails). Set in Vercel and `.env.local` for production URL.

---

## 3. MCP (Cursor)

**Config file**: `.cursor/mcp.json`

| Server | URL | Purpose |
|--------|-----|--------|
| **vercel** | `https://mcp.vercel.com` | Vercel project/deploy from Cursor |
| **supabase** | `https://mcp.supabase.com/mcp` | Supabase project/data from Cursor |

**Connection**: Cursor reads `.cursor/mcp.json` and connects to these MCP servers. No code in the repo imports or calls MCP; they are editor/tooling integrations only.

**Check in Cursor**:  
Settings → MCP → confirm “vercel” and “supabase” show as connected (or no errors). If a server is unreachable, check network and that the URL is reachable (e.g. `https://mcp.vercel.com`, `https://mcp.supabase.com/mcp`).

---

## 4. 連通檢查

本機可執行 `npm run check-connections` 驗證 **GitHub**（remote）、**Vercel**（環境）、**Supabase**（變數與 Auth）、**Upstash Redis**（變數與 REST）是否一致且連通。詳見 `docs/DEPLOYMENT_AND_ENV_FAQ.md`。

---

## 5. Env Checklist

**Production (Vercel)**  
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`  
- [ ] `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_OWNER_USER_ID`  
- [ ] `OPENAI_API_KEY` (and optionally `OPENAI_*` tuning)  
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (recommended for multi-instance)  
- [ ] `NEXT_PUBLIC_SITE_URL` = production URL (e.g. `https://www.customeraipro.com`)  

**Local (`.env.local`)**  
- Same as above for the features you test locally; `.env.example` lists all keys (no secrets).

---

## 6. Dependencies (package.json)

- **Supabase**: `@supabase/ssr`, `@supabase/supabase-js`
- **LINE**: `@line/bot-sdk`
- **OpenAI**: `openai`
- **Redis**: `@upstash/redis`  
No `@vercel/kv`; all Redis usage is via `@upstash/redis` and Upstash env vars.
