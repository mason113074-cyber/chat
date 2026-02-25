# CustomerAIPro — 深度檢查與改進清單

**檢查日期**：2026-02-25  
**Repo**：https://github.com/mason113074-cyber/chat.git  
**正式網域（唯一真實來源）**：https://www.customeraipro.com  

**主要路由（next-intl locale path）**：

- https://www.customeraipro.com/zh-TW
- https://www.customeraipro.com/zh-TW/dashboard
- https://www.customeraipro.com/zh-TW/dashboard/conversations
- https://www.customeraipro.com/zh-TW/dashboard/contacts
- https://www.customeraipro.com/zh-TW/dashboard/knowledge-base
- https://www.customeraipro.com/zh-TW/dashboard/analytics
- https://www.customeraipro.com/zh-TW/dashboard/automations
- https://www.customeraipro.com/zh-TW/dashboard/campaigns
- https://www.customeraipro.com/zh-TW/dashboard/settings

---

## 一、GitHub 與程式庫對照結果

### 1.1 已確認正常

| 項目 | 狀態 |
|------|------|
| **正式網域與 URL 來源** | `lib/app-url.ts` 的 `getAppUrl()` 為單一來源；fallback 為 `https://www.customeraipro.com` |
| **robots.txt** | 已使用 `getAppUrl()`，未硬編碼 |
| **sitemap** | 已使用 `getAppUrl()`，含 zh-TW/en 與 alternates.languages |
| **LINE callback 導向** | 已 locale-aware（`getLocaleFromRequest(request)` + `${appUrl}/${locale}/...`） |
| **forgot-password 導向** | 已用 `window.location.origin` + `useLocale()`，未寫死 zh-TW |
| **cache.ts** | 無 setInterval，僅註解說明 serverless 不需 setInterval |
| **SECURITY.md** | 已存在於 repo 根目錄 |

### 1.2 需修正或補強

#### P0 / 高優先

- **~~`/api/test-ai` 與 `/api/test-alert` 已刪除，但仍有引用~~**（已處理 2026-02-25）
  - 已改為使用 `/api/chat`：health-check、設定頁、TestDashboard、單元測試與文件皆已更新；test-alert 與 test-ai 端點已從文件中移除。

#### P1 — 應盡快處理

- **RLS 效能**  
  - 28 條 policy 仍用 `auth.uid()` 而非 `(select auth.uid())`，影響效能。  
  - 草稿：`033_rls_auth_uid_subquery.sql`（先做 users/contacts/knowledge_base，其餘表可分批）。

- **FK 缺索引**  
  - 表：ab_test_assignments, ai_feedback(x2), ai_suggestions(x2), conversations, workflow_logs。  
  - 草稿：`034_fk_indexes_draft.sql`（CREATE INDEX IF NOT EXISTS，可安全執行）。

- **CSP**  
  - 目前含 `unsafe-inline` / `unsafe-eval`（遷就 Next/React），列為技術債；見 `docs/DEEP_DIVE_IMPROVEMENTS.md`，後續可改 nonce 或 strict-dynamic。

- **testsprite_tests 遺留**  
  - 若不再使用 TestSprite，建議刪除或移出 repo，避免混淆。

- **Merged branches**  
  - 依 engineering-status：21 個已 merge 分支可刪除，清理後約剩 5 個分支。

#### P2 — 品質與一致性

- **Dependabot**  
  - `.github/dependabot.yml` 已補上 major 忽略：`tailwindcss`、`@line/bot-sdk`。

- **sitemap 與 hreflang**  
  - 目前 sitemap 已有 `alternates.languages`（zh-Hant / en）。  
  - 若需完整符合 hreflang 語意（例如在 sitemap XML 中明確輸出 `xhtml:link` hreflang），可再補一層。

- **文件與程式中的 test-ai / test-alert**  
  - 已更新：API_ENDPOINTS、PROJECT_STRUCTURE、NOTION_SYNC、INTEGRATIONS_AND_MCP、RUNBOOK；health-check、settings、TestDashboard 與單元測試皆改為使用 `/api/chat`。

- **help-articles 中的 Webhook URL**  
  - 部分文章仍寫死 `https://www.customeraipro.com/api/webhook/line`；可改為使用 `getAppUrl()` 或說明「請以實際網域替換」，並在文件中註明正式網域為 https://www.customeraipro.com。

#### P3 — 維運與流程

- **Branch protection**  
  - main 尚未啟用「Require status checks to pass before merging」。  
  - 設定方式見 `docs/BRANCH_PROTECTION.md`（建議要求 `ci` 通過）。

- **PR / Issue 整理**  
  - 依 engineering-status：建議關閉 PR #32、#36、#47；保留 #48、#46、#39、#38。  
  - Open Issue #26（退款政策）由 PR #48 處理中，可一併追蹤。

- **Supabase**  
  - HaveIBeenPwned 密碼洩漏保護：到 Dashboard 一鍵開啟。  
  - `ai_feedback` RLS INSERT：若仍為 `WITH CHECK (true)`，改為限制為 service_role（或同等原則）。

---

## 二、安全與硬編碼檢查摘要

- **正式網域**：程式內多數已透過 `getAppUrl()` 或 `process.env.NEXT_PUBLIC_APP_URL`，fallback 為 `https://www.customeraipro.com`，可接受。
- **mailto / 對外聯絡**：`privacy@customeraipro.com`、`support@customeraipro.com` 出現在頁面與文件，屬業務聯絡用，非機密。
- **Notion API**：`scripts/notion-insert-row.ts` 使用 `https://api.notion.com/v1`，為公開 API 網址，無需改動。
- **E2E / 腳本**：`localhost:3000` 僅出現在開發／測試腳本與 env fallback，合理。

未發現明顯的 secret 或 API key 硬編碼；敏感設定應僅來自 `process.env` 與 Vercel 環境變數。

---

## 三、建議新增或補齊的項目

1. **單一「正式網域與路由」文件**  
   - 將本文件開頭的「正式網域 + 主要路由」段落抽成 `docs/OFFICIAL_URLS_AND_ROUTES.md`（或併入 `docs/NOTION_SYNC.md`），方便 onboarding 與維運對照。

2. **藍圖與 PDF 產出**  
   - 專案藍圖已整理於 `.cursor/plans/saas_project_blueprint_*.plan.md`；可另存為 `docs/PROJECT_BLUEPRINT.md`，並用既有 `docs/plan-blueprint-for-pdf.html` 列印為 PDF 供對外分享。

3. **CI 與部署檢查清單**  
   - 在 `docs/DEPLOYMENT_AND_ENV_FAQ.md` 或 RUNBOOK 中加一節「上線前檢查」：  
     - 環境變數（含 `NEXT_PUBLIC_APP_URL`、`NEXT_PUBLIC_SITE_URL`）  
     - LINE Webhook URL 使用 `https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}`  
     - Redis（multi-bot production 必填）  
     - Cron secrets（若使用）

4. **Dependabot**  
   - 在 `dependabot.yml` 的 `ignore` 中新增 `tailwindcss`、`@line/bot-sdk` 的 `version-update:semver-major`，避免未規劃的 major 升級 PR。

---

## 四、總結

- **必須先處理**：~~test-ai / test-alert 已刪除但仍有引用~~（已改為使用 /api/chat，見上）。
- **建議本週內**：RLS 與 FK 索引 migrations、CSP 與 Dependabot 補齊（Dependabot 已補）、~~文件與程式對 test-ai/test-alert 的清理~~（已完成）、branch protection 啟用。
- **其餘**：依 P2/P3 排程與 `engineering-status.mdc` 逐步執行即可。

以上內容可同步到 Notion 或專案看板，並在完成項目前打勾或關聯對應 PR/Issue。
