# CustomerAIPro 技術棧清單

## Table of Contents
- [4.1 核心框架](#41-核心框架)
- [4.2 UI / Styling](#42-ui--styling)
- [4.3 狀態管理](#43-狀態管理)
- [4.4 資料庫與 ORM](#44-資料庫與-orm)
- [4.5 認證授權](#45-認證授權)
- [4.6 外部 API 整合](#46-外部-api-整合)
- [4.7 部署與 DevOps](#47-部署與-devops)

---

## 4.1 核心框架

| 項目 | 版本/技術 |
|------|-----------|
| **Next.js** | ^16.1.6（App Router） |
| **React** | ^18.3.1 |
| **TypeScript** | ^5.6.2（tsconfig strict） |

- 路由：App Router（`app/[locale]/...`）。
- 多語系：`next-intl` ^4.8.3（`[locale]` 動態段 + messages）。

---

## 4.2 UI / Styling

| 項目 | 說明 |
|------|------|
| **Tailwind CSS** | ^3.4.13，utility-first 樣式 |
| **PostCSS** | ^8.4.47，autoprefixer ^10.4.20 |
| **UI 組件** | 無 shadcn/Radix 等套件，以自寫元件 + Tailwind 為主 |
| **圖標** | 內聯 SVG 或 emoji，未見獨立 icon 庫 |

---

## 4.3 狀態管理

- **React useState / useMemo**：表單、列表、搜尋等本地狀態。
- **無 Zustand / Redux**：未使用全域狀態庫。
- **伺服器狀態**：由各頁/元件自行 fetch API，無 React Query/SWR 等（可選後續引入）。

---

## 4.4 資料庫與 ORM

| 項目 | 說明 |
|------|------|
| **Database** | Supabase（PostgreSQL） |
| **ORM / Query** | 無 Prisma/Drizzle；直接使用 Supabase Client `from('table').select().insert().update()` |
| **Client** | `@supabase/supabase-js` ^2.45.0 |
| **SSR 整合** | `@supabase/ssr` ^0.8.0（Cookie 與 server client） |

- 表結構由 Supabase 後台或 migrations 管理，未在 repo 內放 schema 檔。

---

## 4.5 認證授權

| 項目 | 說明 |
|------|------|
| **方案** | Supabase Auth（Email/Password、OAuth） |
| **Session** | Cookie-based（@supabase/ssr）；API 可選 Bearer token |
| **輔助** | `lib/auth-helper.ts`：`getAuthFromRequest(request)` 統一取得 user |
| **LINE 綁定** | `/api/auth/line`、`/api/auth/line/callback`、`/api/auth/line/unbind` |

- 無 NextAuth.js；登入/註冊直接呼叫 `supabase.auth.signUp` / `signInWithPassword`。

---

## 4.6 外部 API 整合

| 整合對象 | 用途 | 備註 |
|----------|------|------|
| **LINE Messaging API** | 接收 Webhook、回覆訊息 | `@line/bot-sdk` ^9.4.0；`lib/line.ts` 簽章與回覆 |
| **OpenAI API** | GPT 回覆生成 | `openai` ^4.67.0；`lib/openai.ts`（gpt-4o-mini 等） |
| **Lemon Squeezy** | 訂閱/付款 | 計畫中；目前有 `/api/subscription`、`/api/payments` 等端點預留 |

- **Upstash Redis**：`@upstash/redis` ^1.36.2，用於 rate limit、冪等、快取；未設定時有記憶體 fallback。

---

## 4.7 部署與 DevOps

| 項目 | 說明 |
|------|------|
| **Hosting** | Vercel（依專案規則） |
| **CI/CD** | 連動 GitHub，push 後自動部署（依 Vercel 設定） |
| **測試** | Playwright ^1.58.2（E2E）、Vitest ^2.1.6（單元）、Testing Library |
| **Lint** | ESLint（eslint-config-next 14.2.15） |
| **型別檢查** | `tsc --noEmit`（package.json script） |

---

## 依賴摘要（package.json）

### 主要依賴

- `next` ^16.1.6  
- `react`, `react-dom` ^18.3.1  
- `next-intl` ^4.8.3  
- `@supabase/supabase-js` ^2.45.0  
- `@supabase/ssr` ^0.8.0  
- `@line/bot-sdk` ^9.4.0  
- `openai` ^4.67.0  
- `@upstash/redis` ^1.36.2  

### 開發依賴

- `typescript` ^5.6.2  
- `tailwindcss` ^3.4.13  
- `@playwright/test` ^1.58.2  
- `vitest` ^2.1.6  
- `eslint`, `eslint-config-next`  

---

*最後更新：依 package.json 與專案結構整理。*
