# CustomerAIPro 專案程式碼結構

## Table of Contents
- [1. 目錄樹狀圖](#1-目錄樹狀圖)
- [2. 前端架構](#2-前端架構)
- [3. 後端架構](#3-後端架構)
- [4. 設定檔](#4-設定檔)
- [5. 資料結構與 lib](#5-資料結構與-lib)

---

## 1. 目錄樹狀圖

（排除 `node_modules`, `.next`, `.git`）

```
chat/
├── app/
│   ├── [locale]/                    # 多語系路由
│   │   ├── page.tsx                 # 首頁
│   │   ├── demo/page.tsx
│   │   ├── help/
│   │   │   ├── page.tsx             # Help 中心首頁
│   │   │   ├── not-found.tsx
│   │   │   └── [category]/          # 動態：分類
│   │   │       ├── page.tsx
│   │   │       └── [article]/       # 動態：文章
│   │   │           └── page.tsx
│   │   ├── support/page.tsx
│   │   ├── docs/page.tsx
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── settings/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── onboarding/page.tsx
│   │       ├── knowledge-base/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── conversations/page.tsx
│   │       ├── conversations/[contactId]/page.tsx
│   │       ├── contacts/page.tsx
│   │       ├── billing/page.tsx
│   │       └── system-test/page.tsx
│   ├── api/                         # API 路由（見後端架構）
│   └── components/
│       ├── LandingNavbar.tsx
│       ├── LandingFooter.tsx
│       ├── LandingFAQ.tsx
│       └── QuickReplies.tsx
├── components/
│   ├── demo/                        # Demo 頁元件
│   ├── help/                        # Help 相關
│   ├── dashboard/                   # Dashboard 共用與測試
│   ├── LocaleSwitcher.tsx
│   ├── GlobalSearch.tsx
│   ├── SetLocaleHtml.tsx
│   ├── EmptyState.tsx
│   └── Toast.tsx
├── lib/                             # 工具、類型、常數
├── i18n/                            # next-intl 設定
├── messages/                        # 語系 JSON (en, zh-TW)
├── public/
├── scripts/
├── e2e/                             # Playwright E2E
├── docs/                            # 本說明文檔
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 前端架構

### 2.1 Pages / Routes

| 路徑 | 檔案 | 動態路由 | 備註 |
|------|------|----------|------|
| `/` | `app/[locale]/page.tsx` | `[locale]` | 首頁 |
| `/demo` | `app/[locale]/demo/page.tsx` | `[locale]` | Demo |
| `/help` | `app/[locale]/help/page.tsx` | `[locale]` | Help 中心首頁 |
| `/help/[category]` | `app/[locale]/help/[category]/page.tsx` | `[locale]`, `[category]` | 分類列表 |
| `/help/[category]/[article]` | `app/[locale]/help/[category]/[article]/page.tsx` | `[locale]`, `[category]`, `[article]` | 單篇文章 |
| `/support` | `app/[locale]/support/page.tsx` | `[locale]` | 聯絡支援 |
| `/docs` | `app/[locale]/docs/page.tsx` | `[locale]` | API 文件（可導向 404） |
| `/login` | `app/[locale]/login/page.tsx` | `[locale]` | 登入 |
| `/forgot-password` | `app/[locale]/forgot-password/page.tsx` | `[locale]` | 忘記密碼 |
| `/terms` | `app/[locale]/terms/page.tsx` | `[locale]` | 服務條款 |
| `/privacy` | `app/[locale]/privacy/page.tsx` | `[locale]` | 隱私政策 |
| `/pricing` | `app/[locale]/pricing/page.tsx` | `[locale]` | 定價 |
| `/settings` | `app/[locale]/settings/page.tsx` | `[locale]` | 設定（重導向） |
| `/dashboard` | `app/[locale]/dashboard/page.tsx` | `[locale]` | 儀表板首頁 |
| `/dashboard/onboarding` | `app/[locale]/dashboard/onboarding/page.tsx` | `[locale]` | 新手引導 |
| `/dashboard/knowledge-base` | `app/[locale]/dashboard/knowledge-base/page.tsx` | `[locale]` | 知識庫 |
| `/dashboard/analytics` | `app/[locale]/dashboard/analytics/page.tsx` | `[locale]` | 分析 |
| `/dashboard/conversations` | `app/[locale]/dashboard/conversations/page.tsx` | `[locale]` | 對話列表 |
| `/dashboard/conversations/[contactId]` | `app/[locale]/dashboard/conversations/[contactId]/page.tsx` | `[locale]`, `[contactId]` | 單一聯絡人對話 |
| `/dashboard/contacts` | `app/[locale]/dashboard/contacts/page.tsx` | `[locale]` | 聯絡人 |
| `/dashboard/billing` | `app/[locale]/dashboard/billing/page.tsx` | `[locale]` | 帳單 |
| `/dashboard/system-test` | `app/[locale]/dashboard/system-test/page.tsx` | `[locale]` | 系統檢測 |

- **Layout / loading / error**：專案使用 App Router，各段若有 `layout.tsx`、`loading.tsx`、`error.tsx` 會套用；目前主要 layout 在 `app/[locale]` 層級由 next-intl 與導覽處理。

### 2.2 Components 分類

| 分類 | 路徑 | 用途 |
|------|------|------|
| **Landing** | `app/components/LandingNavbar.tsx`, `LandingFooter.tsx`, `LandingFAQ.tsx` | 官網導覽、頁尾、FAQ |
| **Demo** | `components/demo/InteractiveTour.tsx`, `DemoCTA.tsx`, `DemoVideo.tsx` | Demo 頁互動與 CTA |
| **Help** | `components/help/ContextualHelp.tsx` | Help 情境說明 |
| **Dashboard 共用** | `components/dashboard/shared/StatCard.tsx`, `StatusBadge.tsx`, `ErrorCollapse.tsx`, `TrendChart.tsx` | 統計卡、狀態、錯誤摺疊、趨勢圖 |
| **Dashboard 測試** | `components/dashboard/test-dashboard/TestDashboard.tsx`, `TestResultsList.tsx`, `TestControlPanel.tsx` 等 | 系統檢測儀表板 |
| **Conversations** | `app/[locale]/dashboard/conversations/components/` | 對話列表、篩選、批次、標籤、搜尋等 |
| **通用** | `components/LocaleSwitcher.tsx`, `GlobalSearch.tsx`, `EmptyState.tsx`, `Toast.tsx` | 語系切換、搜尋、空狀態、Toast |
| **QuickReplies** | `app/components/QuickReplies.tsx` | 快速回覆 UI |

### 2.3 Styles

- **Tailwind CSS**：全域透過 `tailwind.config.ts` 與 PostCSS 編譯。
- **無獨立全域 CSS 檔**：樣式以 Tailwind utility 為主，必要時元件內 `className`。

---

## 3. 後端架構

### 3.1 API Routes 總覽

| Endpoint | Methods | 檔案 | 功能簡述 |
|----------|---------|------|----------|
| `/api/auth/line` | GET | `app/api/auth/line/route.ts` | LINE OAuth 登入入口 |
| `/api/auth/line/callback` | GET | `app/api/auth/line/callback/route.ts` | LINE OAuth callback |
| `/api/auth/line/unbind` | POST | `app/api/auth/line/unbind/route.ts` | 解除 LINE 綁定 |
| `/api/settings` | GET, POST | `app/api/settings/route.ts` | 使用者設定讀寫 |
| `/api/settings/line` | GET, PUT | `app/api/settings/line/route.ts` | LINE Channel 設定 |
| `/api/settings/line/test` | POST | `app/api/settings/line/test/route.ts` | LINE 連線測試 |
| `/api/settings/preview` | POST | `app/api/settings/preview/route.ts` | 設定預覽 |
| `/api/plans` | GET | `app/api/plans/route.ts` | 方案列表 |
| `/api/knowledge-base` | GET, POST | `app/api/knowledge-base/route.ts` | 知識庫列表與新增 |
| `/api/knowledge-base/import` | POST | `app/api/knowledge-base/import/route.ts` | 知識庫批次匯入 |
| `/api/knowledge-base/[id]` | PUT, DELETE | `app/api/knowledge-base/[id]/route.ts` | 單一知識庫更新/刪除 |
| `/api/knowledge-base/test` | POST | `app/api/knowledge-base/test/route.ts` | 知識庫測試 |
| `/api/knowledge-base/stats` | GET | `app/api/knowledge-base/stats/route.ts` | 知識庫統計 |
| `/api/knowledge-base/search` | GET | `app/api/knowledge-base/search/route.ts` | 知識庫搜尋 |
| `/api/webhook/line` | GET, POST | `app/api/webhook/line/route.ts` | LINE Webhook 接收與回覆 |
| `/api/chat` | POST | `app/api/chat/route.ts` | 儀表板內建聊天（GPT + 知識庫） |
| `/api/health-check` | GET | `app/api/health-check/route.ts` | 健康檢查彙總 |
| `/api/health-check/history` | GET | `app/api/health-check/history/route.ts` | 健康檢查歷史 |
| `/api/health/supabase` | GET | `app/api/health/supabase/route.ts` | Supabase 連線 |
| `/api/health/openai` | GET | `app/api/health/openai/route.ts` | OpenAI 連線 |
| `/api/health/i18n` | GET | `app/api/health/i18n/route.ts` | i18n 檢查 |
| `/api/health/security/rate-limit` | GET | `app/api/health/security/rate-limit/route.ts` | Rate limit 檢查 |
| `/api/health/security/sensitive` | GET | `app/api/health/security/sensitive/route.ts` | 敏感詞檢查 |
| `/api/health/feature/handoff` | GET | `app/api/health/feature/handoff/route.ts` | 轉人工功能檢查 |
| `/api/onboarding/status` | GET | `app/api/onboarding/status/route.ts` | Onboarding 狀態 |
| `/api/onboarding/save` | POST | `app/api/onboarding/save/route.ts` | 儲存 Onboarding |
| `/api/contacts` | GET | `app/api/contacts/route.ts` | 聯絡人列表 |
| `/api/contacts/[id]` | GET | `app/api/contacts/[id]/route.ts` | 單一聯絡人 |
| `/api/contacts/tags` | GET, POST | `app/api/contacts/tags/route.ts` | 標籤列表與新增 |
| `/api/contacts/tags/[id]` | PATCH, DELETE | `app/api/contacts/tags/[id]/route.ts` | 單一標籤更新/刪除 |
| `/api/contacts/[id]/tags` | POST | `app/api/contacts/[id]/tags/route.ts` | 聯絡人加標籤 |
| `/api/contacts/[id]/tags/[tagId]` | DELETE | `app/api/contacts/[id]/tags/[tagId]/route.ts` | 聯絡人移除標籤 |
| `/api/conversations/counts` | GET | `app/api/conversations/counts/route.ts` | 對話計數 |
| `/api/conversations/[id]/status` | PATCH | `app/api/conversations/[id]/status/route.ts` | 對話狀態更新 |
| `/api/conversations/[id]/tags` | PATCH | `app/api/conversations/[id]/tags/route.ts` | 對話標籤更新 |
| `/api/conversations/batch` | POST | `app/api/conversations/batch/route.ts` | 批次操作 |
| `/api/analytics/overview` | GET | `app/api/analytics/overview/route.ts` | 分析總覽 |
| `/api/analytics/trends` | GET | `app/api/analytics/trends/route.ts` | 趨勢 |
| `/api/analytics/resolution` | GET | `app/api/analytics/resolution/route.ts` | 解決率 |
| `/api/analytics/hourly` | GET | `app/api/analytics/hourly/route.ts` | 每小時統計 |
| `/api/analytics/top-contacts` | GET | `app/api/analytics/top-contacts/route.ts` | 熱門聯絡人 |
| `/api/analytics/top-questions` | GET | `app/api/analytics/top-questions/route.ts` | 熱門問題 |
| `/api/analytics/quality` | GET | `app/api/analytics/quality/route.ts` | 品質指標 |
| `/api/billing/usage` | GET | `app/api/billing/usage/route.ts` | 使用量 |
| `/api/usage` | GET | `app/api/usage/route.ts` | 使用情況 |
| `/api/subscription` | GET, POST, PATCH | `app/api/subscription/route.ts` | 訂閱 |
| `/api/payments` | GET | `app/api/payments/route.ts` | 付款記錄 |
| `/api/line/verify` | POST | `app/api/line/verify/route.ts` | LINE 驗證 |
| `/api/search` | GET | `app/api/search/route.ts` | 全域搜尋 |
| `/api/tags` | GET | `app/api/tags/route.ts` | 標籤列表 |
| `/api/chat` | POST | `app/api/chat/route.ts` | 儀表板內建聊天（測試 AI 回覆） |

### 3.2 Server Actions

- 專案中 **未使用** `'use server'`，無獨立 Server Actions 檔案；後端邏輯皆在 API routes 與 `lib/` 內。

### 3.3 Database

- **Supabase (PostgreSQL)**：透過 `@supabase/supabase-js` 與 `@supabase/ssr` 連線。
- **Schema**：未使用 Prisma/Drizzle 的 schema 檔，表結構由 Supabase 後台或 migration 管理；程式端以 `lib/supabase` 與各 API 的 `from('table_name')` 操作。

---

## 4. 設定檔

| 檔案 | 說明 |
|------|------|
| `next.config.js` | Next.js 設定，使用 `next-intl` plugin，`reactStrictMode: true` |
| `tailwind.config.ts` | Tailwind 主題與 content 路徑 |
| `tsconfig.json` | TypeScript，`paths`: `@/*` → 專案根目錄 |
| `package.json` | 依賴見 [TECH_STACK.md](./TECH_STACK.md) |

---

## 5. 資料結構與 lib

| 檔案 | 用途 |
|------|------|
| `lib/supabase/server.ts` | 服務端 Supabase client |
| `lib/supabase/client.ts` | 瀏覽端 Supabase client |
| `lib/auth-helper.ts` | 從 request 取得 auth（Cookie/Bearer） |
| `lib/plans.ts` | 方案常數與限制（Free/Basic/Pro/Enterprise） |
| `lib/help-articles.ts` | Help 分類與文章清單、內容（ARTICLE_LIST, ARTICLE_CONTENT）、getArticleContent |
| `lib/openai.ts` | OpenAI 呼叫（generateReply） |
| `lib/openai-usage.ts` | Token 使用計算 |
| `lib/openai-error-handler.ts` | OpenAI 錯誤處理 |
| `lib/line.ts` | LINE 簽章驗證、回覆訊息、型別 |
| `lib/knowledge.ts` | 依使用者搜尋知識庫（searchKnowledgeForUser） |
| `lib/knowledge-search.ts` | 知識庫搜尋與快取（searchKnowledgeWithSources, clearKnowledgeCache） |
| `lib/billing-usage.ts` | 對話使用量與方案上限（getConversationUsageForUser） |
| `lib/rate-limit.ts` | 速率限制（Upstash Redis 或記憶體 fallback） |
| `lib/idempotency.ts` | Webhook 冪等（isProcessed, markAsProcessed） |
| `lib/cache.ts` | 一般快取 |
| `lib/analytics-cache.ts` | 分析快取與失效 |
| `lib/auto-tag.ts` | 聯絡人自動標籤 |
| `lib/contact-tags.ts` | 聯絡人標籤邏輯 |
| `lib/security/output-filter.ts` | 輸出過濾 |
| `lib/security/secure-prompt.ts` | 安全 prompt |
| `lib/security/sensitive-keywords.ts` | 敏感詞檢測（detectSensitiveKeywords） |
| `lib/retry.ts` | 重試工具 |
| `lib/alert-service.ts` | 告警服務 |
| `lib/db-monitoring.ts` | DB 監控 |
| `lib/types.ts` | 共用型別 |

---

*最後更新：依專案掃描結果生成。*
