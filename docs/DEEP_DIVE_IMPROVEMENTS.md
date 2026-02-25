# CustomerAIPro 深度檢視：架構、安全、DevOps 與優化建議

> 以「全端 × DevOps × 軟體工程」視角，對正式網域與 GitHub 倉庫的系統性檢視。  
> **正式網域（單一真實來源）**：https://www.customeraipro.com  
> **GitHub**：https://github.com/mason113074-cyber/chat

---

## 一、整體評價（Executive Summary）

- **架構**：Next.js 16 App Router + Supabase + Vercel，職責分明；多語系、多 bot webhook、RLS 隔離已到位。
- **安全**：proxy 層已加安全標頭（CSP、HSTS、X-Frame-Options 等）、LINE 驗簽與冪等、Redis 生產環境要求、Bot 憑證加密。
- **DevOps**：CI（type-check / lint / unit / build）、CodeQL、Dependency Review 齊全；cron 與 env 文件完整。
- **待加強**：CSP 仍含 `unsafe-inline`/`unsafe-eval`、單一 canonical URL 來源未完全統一、部分技術債與可觀測性可再深化。

以下分「須改善」與「可優化」兩類，並給出可行作法。

---

## 二、須改善（會影響正確性、安全或維運）

### 2.1 單一真實來源 URL 未完全統一

- **現狀**：`lib/app-url.ts` 的 `getAppUrl()` 已作為主要來源；`app/robots.ts` 仍直接讀 `process.env.NEXT_PUBLIC_APP_URL` 並 fallback 寫死 `https://www.customeraipro.com`。
- **風險**：staging 或不同環境若未設 env，robots 的 sitemap URL 可能與實際站點不一致；不利於多環境與 SEO 一致。
- **建議**：`robots.ts` 改為使用 `getAppUrl()`，與 sitemap、metadata 一致。

```ts
// app/robots.ts
import { getAppUrl } from '@/lib/app-url';
const BASE_URL = getAppUrl();
```

### 2.2 CSP 仍允許 unsafe-inline / unsafe-eval

- **現狀**：`proxy.ts` 的 CSP 為  
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'`。
- **風險**：XSS 攻擊面較大；若第三方腳本被塞入，影響範圍大。
- **建議**：
  - 短期：維持現狀但列為技術債，在 `engineering-status.mdc` 註記「CSP 放寬為遷就 Next/React，待改用 nonce 或 strict-dynamic 再收緊」。
  - 中期：Next.js 16 若支援 CSP nonce，改為 `script-src 'self' 'nonce-{nonce}'`，並逐步移除 `unsafe-inline`/`unsafe-eval`；style 可保留 `'unsafe-inline'` 或改為 nonce。

### 2.3 生產環境 Redis 未設定時的 fail-safe 語意

- **現狀**：webhook 在 production 若未設定 Upstash，會將事件標為 `failed` 並回傳 200，避免 LINE 重試暴量。
- **風險**：若團隊誤以為「沒 Redis 也能跑」，可能上線後才發現事件未處理；日誌雖有錯誤，但需確保有監控告警。
- **建議**：
  - 在 Vercel 或監控中對 `[LINE webhook] Upstash Redis is not configured` 與 `status: 'failed'` 設 alert。
  - 在「上線檢查清單」或 runbook 中明確寫：production 多 instance 必須設定 `UPSTASH_REDIS_REST_*`。

### 2.4 健康檢查與 Cron 的保護

- **現狀**：`vercel.json` 有 `/api/health-check`（每 15 分）、`/api/cron/cleanup-webhook-events`（每日）；cleanup 用 `WEBHOOK_CLEANUP_CRON_SECRET` 驗證。
- **風險**：若 health-check 被當成 DDoS 入口或暴露過多資訊，可能被探測。
- **建議**：health-check 僅回傳必要狀態（如 `{ ok: true }` 或加上簡單的 DB ping），不暴露內部路徑或版本；必要時可加 IP 白名單或 Vercel Cron 的 internal header 驗證（若平台支援）。

### 2.5 RLS 與索引的已知技術債

- **現狀**：`engineering-status.mdc` 已列：28 條 RLS 用 `auth.uid()` 而非 `(select auth.uid())`；7 個 FK 缺索引。
- **影響**：高併發時可能鎖競爭或查詢變慢。
- **建議**：排程 migration：  
  - RLS 改為 `(select auth.uid())` 一次一表、分批上線並觀察。**草稿**：`supabase/migrations/033_rls_auth_uid_subquery.sql`（Part 1：users, contacts, knowledge_base；其餘表列於檔內註解）。  
  - 為 ab_test_assignments、ai_feedback、ai_suggestions、conversations、workflow_logs 等補上 FK 索引。**草稿**：`supabase/migrations/034_fk_indexes_draft.sql`。

---

## 三、可優化（品質、SEO、可維護性、未來擴展）

### 3.1 SEO 與多語系

- **sitemap**：已使用 `getAppUrl()` 與 `alternates.languages`（zh-Hant / en），結構正確。
- **robots**：改為 `getAppUrl()` 後，sitemap URL 與全站 canonical 一致。
- **建議**：若有「僅限特定 locale 的頁面」，可在 sitemap 的 `alternates` 中只列出該頁存在的 locale，避免 404。

### 3.2 可觀測性（Observability）

- **現狀**：依賴 `console.error` / `console.warn`；Vercel 會蒐集 log。
- **建議**：
  - 關鍵路徑（webhook 接收、AI 呼叫、DB 錯誤）使用結構化欄位（如 `requestId`、`botId`、`status`），方便在 Vercel Logs 或未來整合 Datadog/Logtail 查詢。
  - 可選：在 API 層加 requestId middleware，一路傳遞到 webhook 與 AI 層。
  - 若有成本考量，可對「OpenAI 呼叫次數 / token 用量」做簡單計數並寫入 DB 或 log，方便後續優化。

### 3.3 前端效能與載入

- **現狀**：Next.js 16 預設優化；Landing 已拆成多個 section 元件。
- **建議**：
  - 對首屏以外區塊使用 `next/dynamic` 與 `loading` 降低 TTI。
  - 若有大型圖表（如 analytics），可考慮 lazy load 或 SSR 只輸出關鍵數據、其餘 client 再補。
  - 確認 `next/image` 用於所有遠端圖片（如 LINE 頭像），避免 layout shift。

### 3.4 API 設計與錯誤契約

- **現狀**：API 多以 `NextResponse.json({ error: '...' }, { status: 4xx/5xx })` 回傳。
- **建議**：
  - 訂一個最小契約：例如 `{ error: string, code?: string }`；重大 API 可加 `requestId` 便於追蹤。
  - 5xx 時避免在 response body 洩漏內部錯誤；詳細錯誤只寫 log。

### 3.5 測試與 CI

- **現狀**：CI 含 type-check、lint、unit、build；單元測試有 act() 與 canvas 警告但不擋綠燈。
- **建議**：
  - 有餘力時收斂 rate-limit 與 TestDashboard 的 log/act，或對 a11y 略過 canvas（或 mock）。
  - E2E 對關鍵流程（登入 → dashboard → 一則對話）保留 smoke test；production URL 的 E2E 用專用帳號與 env，不寫死密碼。

### 3.6 文件與維運

- **現狀**：`.env.example`、`docs/NOTION_SYNC.md`、runbook、engineering-status 齊全。
- **建議**：
  - 在 repo 根目錄或 `docs/` 增加 **SECURITY.md**：說明如何回報漏洞、支援的版本、依賴更新策略。  
    **→ 已落實**：見 repo 根目錄 `SECURITY.md`。
  - Runbook 中補齊「Supabase Redirect URLs / LINE Login Callback URL」清單（若尚未有），避免新成員或新環境漏設。  
    **→ 已落實**：見 `docs/RUNBOOK.md`。

### 3.7 依賴與升級策略

- **現狀**：React 19、Next 16、Supabase 2.x、next-intl 4.x；Dependency Review 對 high severity 失敗。
- **建議**：
  - Dependabot 或 Renovate 設定中，對易破壞的 major（如 tailwind、@line/bot-sdk）可暫時 ignore 或分開 PR，避免一次大量變動。
  - 升級後在 staging 或 preview 跑 E2E 再合併 main。

### 3.8 分支與權限

- **現狀**：main 無強制 CI 通過才 merge 的 branch protection。
- **建議**：在 GitHub 設定 **Branch protection**：main 需通過 CI、必要時至少 1 review；可選「require status checks to pass」。
- **設定方式**：見 `docs/BRANCH_PROTECTION.md`（逐步說明 + 本專案 CI job 名稱 `ci`）。

---

## 四、架構與資料流（簡要）

- **使用者**：瀏覽 https://www.customeraipro.com/zh-TW（或 /en）→ proxy（auth + locale）→ App Router 或 API。
- **LINE**：POST → `https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}` → 驗簽、冪等、落庫 → 非同步處理 → 回 LINE 200。
- **Dashboard**：登入後 /zh-TW/dashboard/* → Supabase RLS → 對話/聯絡人/知識庫/分析等；AI 建議草稿一鍵送出。
- **Cron**：Vercel 觸發 health-check、cleanup-webhook-events（帶 secret）；cleanup 依 retention 刪除舊 webhook_events。

---

## 五、建議執行順序（優先）

| 優先 | 項目 | 動作 |
|------|------|------|
| 1 | 單一 URL 來源 | robots.ts 改用 getAppUrl() |
| 2 | 技術債文件 | 更新 engineering-status：CSP 現狀與 RLS/索引待辦 |
| 3 | 維運 | Runbook 補齊 callback/redirect URL 清單；production 檢查清單註明 Redis 必填 |
| 4 | 安全 | 新增 SECURITY.md |
| 5 | 中長期 | RLS migration、CSP nonce、branch protection、可觀測性結構化 log |

---

## 六、結論

- **網域與路由**：正式環境以 https://www.customeraipro.com 為唯一來源，next-intl 的 zh-TW/en 與 dashboard 路由清楚；補上 robots 使用 getAppUrl() 即一致。
- **安全與可靠**：Webhook 驗簽、冪等、生產 Redis 要求、安全標頭、Bot 加密均已落實；CSP 可列為下一階段收緊目標。
- **DevOps**：CI/CD、cron、env 文件完備；建議補 SECURITY.md、branch protection 與 runbook 的 URL 清單。
- **優化**：RLS/索引 migration、CSP 收緊、結構化 log、E2E 與單元測試收斂，可按優先序排入 sprint。

整體而言，系統已具備上線與持續迭代的基礎；上述項目依序處理後，可進一步提升安全性、可維護性與可觀測性。

---

*文件產出後可同步至 Notion 或 docs/ 作為「架構與改善藍圖」參考。*
