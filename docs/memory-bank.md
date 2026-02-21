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

## 5. AI 回覆功能深度加強（高優先級上下文）

> **⚠️ 相關開發前請先讀取本節**；禁止覆蓋既有 settings 行為。

### 5.1 架構決策

- **設定存儲**：沿用 `users` 表，新增 `ai_reply_config` jsonb 欄位，儲存：
  - `reply_length`：簡短/適中/詳細
  - `format_emoji`, `format_bullets`, `format_markdown`：格式偏好
  - `closing_behavior`：結尾行為（附加「還有其他問題嗎？」等）
  - `confidence_threshold`：信心閾值（預設 60），低於則觸發轉人工
  - `offline_behavior`：離線時行為（繼續 AI / 附加離線訊息 / 僅離線訊息）
  - `reply_delay_sec`：回覆延遲（0–5 秒）
  - `memory_turns`：多輪對話記憶長度（3/5/10/全部）
  - `guidance_style`, `guidance_forbidden`, `guidance_escalation`：Fin-style 行為指令
  - `business_hours`：營業時間（週幾、開始、結束）
  - `sensitive_words`：敏感詞陣列，每項 `{word, action: replace|escalate}`

- **滿意度回饋**：新增 `ai_feedback` 表
  - 欄位：`id`, `user_id`, `conversation_id`, `message_id`, `feedback` (thumbs_up/thumbs_down), `created_at`
  - RLS：`auth.uid() = user_id`

### 5.2 Supabase 存取規則（AI 回覆擴展）

- **users.ai_reply_config**：沿用既有 users RLS，無需額外 policy
- **ai_feedback**：`auth.uid() = user_id`（SELECT/INSERT）；透過 conversation_id 關聯取得 user_id

### 5.3 實作順序（Sprint）

1. 回覆長度與格式控制（1–2h）
2. 敏感詞過濾（1–2h）
3. 回覆延遲（30min–1h）
4. 多語言自動偵測（30min）
5. Guidance 行為指令（2–3h）
6. 信心分數 + 自動轉人工（3–4h）
7. 營業時間設定（2–3h）
8. 滿意度回饋（2–3h）
9. 多輪對話記憶（2–3h）
10. 歡迎訊息編輯器（1–2h）
11. AI 回覆品質儀表板（3–4h）
12. A/B 測試（4–6h）

### 5.4 技術注意事項

- **信心分數**：gpt-4o-mini 若無 logprobs，可用 heuristic（關鍵字如「不確定」「可能」）或僅關鍵字觸發轉人工
- **營業時間**：需考慮用戶 store 時區
- **滿意度**：LINE Flex Message 設計 👍👎 按鈕，需 webhook 或 endpoint 處理回傳
- **多輪記憶**：token 消耗增加，需在 billing/usage 反映

---

*最後更新：依專案現狀與「AI 回覆功能深度加強」sequential-thinking 拆解結論寫入。*
