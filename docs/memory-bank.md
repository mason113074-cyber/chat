# Memory Bank — 高優先級上下文

> **⚠️ 高優先級上下文 (HIGH PRIORITY CONTEXT)**  
> 未來對話中，凡涉及架構、Supabase 存取、計費權限、多租戶邏輯時，**請務必先讀取本文件與 `knowledge-graph-memory.md`**。  
> **禁止覆蓋或破壞既有架構設定**；新增規則或表時須與本文件一致並在此更新。

---

## 1. 核心架構決策

- **產品**：CustomerAIPro — AI 智能客服 SaaS。正式網址：https://www.customeraipro.com
- **技術棧**：Next.js 16 (App Router) + Supabase (PostgreSQL, Auth, RLS) + OpenAI GPT-4o-mini；TypeScript；UI 繁體中文；部署 Vercel。
- **租戶模型**：一 user 一租戶。`auth.users.id` = `public.users.id`，所有業務資料以 `user_id` 歸屬，無 organization/workspace 層級。
- **方案與計費**：
  - 有效方案以 **`subscriptions` 表**為唯一真相來源（status=active，且 current_period_end >= now）；無有效訂閱時視為 `free`。
  - 用量上限以 **`lib/plans.ts`** 的 `PLAN_LIMITS`（slug: free, starter, basic, pro, business, enterprise）為準；與 DB 表 `public.plans` 的 `limits` jsonb 對齊。
  - **權限/用量檢查僅在應用層**（API 或共用 service）實作；RLS 僅做「列屬於該 user」的隔離，**不包含**「是否超量」的邏輯。
  - 超限時 **拒絕請求**（403 + 明確錯誤），不採「先執行再標記」。
- **認證**：Supabase Auth；Cookie + Bearer token 雙認證。敏感/跨租戶操作用 `SUPABASE_SERVICE_ROLE_KEY`（僅 server 端）；前端只用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- **API**：路由置於 `/app/api/`；一律先驗證 session；回傳統一用 `NextResponse.json()`。

---

## 2. Supabase 存取規則

- **Server 端**：使用 `createRouteHandlerClient`（或專案內等價的 server client）建立 Supabase client。
- **RLS**：所有業務表皆啟用 RLS；原則為「使用者僅能讀/寫屬於自己的列」：
  - **users**：`auth.uid() = id`（select / update / insert own row only）。
  - **contacts**：`auth.uid() = user_id`（all）。
  - **conversations**：透過 `contact_id` → `contacts.user_id = auth.uid()`（select/insert）。
  - **orders**：透過 `contact_id` → `contacts.user_id = auth.uid()`（select）。
  - **subscriptions**：`auth.uid() = user_id`（select/insert/update）。
  - **payments**：`auth.uid() = user_id`（select）。
  - **knowledge_base**：`auth.uid() = user_id`（all）。
  - **contact_tags**：`auth.uid() = user_id`（all）。
  - **contact_tag_assignments**：透過 `contact_id` → `contacts.user_id = auth.uid()`（all）。
  - **openai_usage**：`auth.uid() = user_id`（select only）。
  - **health_check_logs** 等系統表：依既有 migration 之 policy，多為 service role 或特定條件。
- **Migration**：放在 `supabase/migrations/`，編號從 010 延續；新增表必須同時撰寫 RLS policy，風格與上列一致。
- **Service role**：API/Webhook 需跨使用者操作時使用 service role key，不依賴前端 anon key。

---

## 3. 目前依賴的套件版本

（以 `package.json` 為準；精確版本以 `package-lock.json` 為準。）

| 套件 | 版本範圍 | 用途 |
|------|----------|------|
| next | ^16.1.6 | App Router、API Routes |
| react | ^18.3.1 | UI |
| react-dom | ^18.3.1 | UI |
| @supabase/ssr | ^0.8.0 | Server-side Supabase |
| @supabase/supabase-js | ^2.45.0 | Supabase client |
| next-intl | ^4.8.3 | 國際化 |
| openai | ^4.67.0 | OpenAI API |
| @line/bot-sdk | ^9.4.0 | LINE Bot |
| @upstash/redis | ^1.36.2 | Redis（選用） |
| typescript | ^5.6.2 | 型別 |
| @playwright/test | ^1.58.2 | E2E |
| vitest | ^2.1.6 | 單元測試 |

---

## 4. 方案限制（lib/plans.ts 對應）

- free：100 對話/月、50 知識庫
- starter / basic：1000 對話/月、200 知識庫
- pro：5000 對話/月、1000 知識庫
- business / enterprise：20000 對話/月、5000 知識庫

（與 DB `public.plans.limits` 及 `/api/billing/usage` 一致。）

---

*最後更新：依專案現狀與「多租戶計費權限邏輯」拆解結論寫入。*
