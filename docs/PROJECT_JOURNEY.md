# CustomerAIPro 開發歷程

記錄 CustomerAIPro 從第一步到現在的完整開發歷程，依 Git log 按時間順序整理。

---

## Phase 0: 專案啟動與基礎架構 (2026-02-17 早期)

### 初始設定

- **2647ca5** Initialize Next.js 14+ CustomerAIPro project
- 建立 Next.js 14 + TypeScript 專案
- 設定 Supabase (PostgreSQL + Auth)
- 配置 LINE Messaging API
- 整合 OpenAI API

### 資料庫設計 (001_phase1_schema.sql)

- **users** 表：用戶基本資料（id 對應 auth.users）、plan、line_channel_id
- **contacts** 表：LINE 聯絡人（user_id, line_user_id, name, tags）
- **conversations** 表：對話／訊息記錄（每列一則訊息：contact_id, message, role）
- **orders** 表：訂單追蹤
- **subscriptions** 表：方案與訂閱狀態
- RLS 政策：使用者僅能存取自己的資料
- 後續 migration **002**：users 新增 **system_prompt** 欄位（無獨立 user_settings 表，設定存於 users）

### LINE Webhook 基礎實作

- **cab6ef1** Phase 1 MVP: Supabase schema, auth, dashboard, LINE webhook, pricing, login
- Webhook endpoint：`/api/webhook/line`
- 訊息接收與解析
- 回覆訊息功能

### OpenAI 整合

- GPT-4o-mini 模型設定
- 對話上下文管理（conversations 表）
- System prompt 設定（users.system_prompt）

---

## Phase 1: Dashboard 核心功能 (2026-02-17)

### P0 修復與優化

- **6bbcbc7** P0-fix: Restore middleware.ts for Supabase session refresh  
  - 恢復 middleware.ts，修正 Supabase session 刷新
- **737de0d** P0: Fix system prompt end-to-end flow  
  - 修復 system prompt 從設定到 API 的完整流程
- **fa19767** Refactor dashboard layout and enhance chat API with user-specific system prompts  
  - 從 sidebar 改為 header 導航  
  - 加入登出與用戶專屬 system prompt

### P1 功能開發

- **ef9282f** P1: Add conversation tags and filter system  
  - 可自訂標籤、依標籤過濾對話
- **348286b** P1: Add AI model selection in settings  
  - 設定頁選擇 OpenAI 模型（GPT-4o-mini / GPT-4o 等）
- **6968db7** P1: Add batch operations for conversations  
  - 多選對話、批次刪除／標記／匯出
- **8a40f9c** P1: Add advanced search and filters  
  - 全文搜尋、日期範圍、聯絡人篩選
- **dd6bdde** P2: Add conversation sorting options  
  - 按時間／未讀／重要性排序

---

## Phase 2: GitHub Copilot Agent 協作開發 (2026-02-17)

### 效能優化

- **PR #11** (3212aab → e835431 Merge) Fix N+1 query problem  
  - Contacts / Dashboard 查詢優化  
  - 減少資料庫往返次數

### 即時更新功能

- **PR #12** (dd93dba → 0be00fb Merge) Supabase Realtime  
  - 對話列表即時更新  
  - 新訊息自動顯示，無需手動重整

### AI 設定頁升級

- **PR #13** (9aa4cd5 → 7c8cc3f Merge) Upgrade AI settings page  
  - 可編輯 system prompt + 即時測試  
  - 測試對話、預覽 AI 回應

### 其他 Copilot 協作

- **PR #5** (2ff5e69): Sidebar layout、dashboard overview 升級
- **PR #7** (99079f3): Skeleton loading、error boundaries、empty states
- 多個 Initial plan / code review 相關 commit（9de744a, 8dca6a3, ca7e514, c3ca4f1, 2bb0b7f, 14d90b2）

---

## Sprint 3: SaaS 核心功能 (2026-02-17)

### 訂閱與計費

- **c1ac0bb** Sprint3: Add billing page with plans and subscription management  
  - 方案展示 (Free/Pro/Enterprise)  
  - 訂閱管理、用量顯示

### Onboarding 流程

- **f7f5adc** Sprint3: Add onboarding flow for new users  
  - 多步驟 onboarding  
  - LINE Channel 設定引導、System prompt 初始化

### Analytics 儀表板

- **40e7189** Sprint3: Add analytics dashboard with charts and insights  
  - 對話數量統計  
  - 回應時間分析、用戶活躍度、圖表視覺化

### 知識庫系統

- **6175026** Sprint3: Add knowledge base with AI integration  
  - 新增／編輯／刪除知識  
  - 關鍵字／向量搜尋整合、AI 自動引用知識

---

## Sprint 4: 進階功能開發 (2026-02-17)

### 知識庫增強

- **f339821** Sprint4: Add knowledge base test conversation feature  
  - 在知識庫頁面直接測試、驗證知識是否被正確引用

### Analytics 增強

- **506d033** Sprint4: Add bot resolution rate and unresolved questions to analytics  
  - AI 成功解決問題比例、未解決問題清單

### 計費系統增強

- **8ac18fb** Sprint4: Add usage progress bar and overage alerts to billing  
  - 用量進度條、接近上限警告、防止超額使用

### 對話管理增強

- **36f5f07** Sprint4: Add conversation status classification and filtering  
  - 待處理／進行中／已解決／已關閉、依狀態篩選

### 聯絡人管理增強

- **1d2a459** Sprint4: Add contact tagging system with auto-labeling  
  - 自動標記（VIP／新客／潛在客戶）、手動標籤管理

### 設定頁面改進

- **2ba861d** Sprint4: Add widget live preview to settings page  
  - LINE 聊天 Widget 即時預覽、調整樣式立即顯示

### 全域搜尋

- **e4535d5** Sprint4: Add global search command palette (Cmd+K)  
  - 全域快捷鍵搜尋、搜尋對話／聯絡人／設定

---

## 測試與品質保證 (2026-02-17 ~ 2026-02-18)

### API 測試

- **7831796, 8a193f6** Test: Add API end-to-end test script  
  - 測試主要 API endpoints、驗證回應格式
- **3dd0721** Fix: Allow test script to target production URL  
  - 允許指定生產環境 URL 測試
- **cd1e22c** Fix: Add Bearer token auth support for API testing  
  - Bearer token 認證支援

### UI 測試

- **212515e** Test: Add 24-step UI e2e checklist spec  
  - Playwright 完整 UI 流程測試、自動化端到端檢查

---

## 網站頁面與法律文件 (2026-02-18)

### Landing Page

- **5d67eee** Feature: Add Landing Page, Terms of Service, Privacy Policy for Lemon Squeezy  
  - 產品介紹頁、Terms of Service、Privacy Policy（為 Lemon Squeezy 準備）

### UI/UX 修復

- **1909c13** Fix: onboarding input text color visibility  
- **1312f59** Fix: onboarding complete button not working  
- **6dc70a5** Fix: bugs + UI/UX improvements  
  - 導航 active 狀態、手機版選單、404、Toast 通知  
- **d76d59e** Fix: Settings page radio button and style selector text color contrast  
  - Radio 與樣式選擇器對比度  
- **6491788** Fix: Remove duplicate JSX fragment in settings page (line 243)

---

## 專案配置優化 (2026-02-18)

### Cursor AI 整合

- **c46ce32** Config: Add Cursor rules and memory bank for project context  
  - 專案上下文、AI 協作規則（.cursor/rules、memory_bank）

---

## Phase 2.5: 技術債務優化 (2026-02-18)

### 重大架構改進

- **3669ac8** feat: Technical debt optimization - security, performance, caching, indexing

**安全性強化**

- LINE Webhook **idempotency**（lib/idempotency.ts）：防止重複處理同一事件，KV + 記憶體 fallback  
- **Rate limiting**（lib/rate-limit.ts）：每使用者 20 req/60s，超限回覆友善訊息、不返回 429  
- **Request ID** 追蹤：每次 webhook 請求唯一 ID，便於日誌串接  

**可靠性提升**

- OpenAI **錯誤分類與 fallback**（lib/openai-error-handler.ts）：rate_limit、timeout、auth、context_length、server_error  
- **重試邏輯**（lib/retry.ts）：指數退避、可重試錯誤才重試  
- **Timeout** 控制：OPENAI_TIMEOUT_MS（預設 30 秒）  
- **月預算檢查**：OPENAI_MONTHLY_BUDGET，超出回傳友善訊息  
- **用量追蹤**：openai_usage 表（migration 012）、trackTokenUsage / checkTokenBudget  

**效能優化**

- **雙層快取**（lib/cache.ts）：Memory + Upstash Redis，getCached / deleteCached / deleteCachedPattern  
- **User settings cache**：10 min TTL，設定更新時 invalidate  
- **Knowledge base 搜尋快取**：5 min TTL，知識庫異動時 clearKnowledgeCache  
- **Analytics cache**（lib/analytics-cache.ts）：10 min TTL，新對話時 invalidate  
- **資料庫索引**（migration 013）：conversations、contacts、knowledge_base、contact_tags 等索引優化  

**架構改進**

- lib/openai.ts 重寫：lazy client、預算／重試／用量／fallback 整合  
- 環境變數：.env.example 補齊 OPENAI_*、UPSTASH_REDIS_REST_* 說明  

**功能擴充（同 commit）**

- 快捷回覆（quick_replies）：users 欄位、設定頁編輯、Widget 預覽  
- MCP 設定：.cursor/mcp.json 改為 Vercel + Supabase  

### 合併與衝突解決

- **9eb1e09** Merge origin/main - resolve settings page conflict (keep contrast fix)  
  - 保留 AI 模型 radio 的對比修正（has-[:checked]:text-indigo-900）

### 部署與文件更新

- **49bd729** docs: Vercel migration - update FAQ, techContext, .env.example KV  
  - 正式環境改為 Vercel（由 Railway 遷移）、Supabase 不變  
  - DEPLOYMENT_AND_ENV_FAQ.md、memory_bank/techContext.md、.env.example KV 註解  

---

## 技術棧演進

### 核心框架

- Next.js 14 → 16 (App Router)
- TypeScript
- React 18
- Tailwind CSS

### 後端服務

- **Supabase**：PostgreSQL、Auth、Realtime、RLS  
- **OpenAI API**：GPT-4o-mini（可切換 gpt-4o、gpt-3.5-turbo）  
- **LINE Messaging API**：Webhook、回覆、Widget  

### 新增服務 (Phase 2.5)

- **Upstash Redis**：冪等、rate limit、各類快取（未設定時記憶體 fallback）  
- **Lemon Squeezy**：計劃中（訂閱與金流）  

### 開發工具

- **Cursor AI**：主要開發與規則／記憶庫  
- **GitHub Copilot Agent**：協作開發（PR #5, #7, #11, #12, #13）  
- **Playwright**：UI E2E 測試  

---

## 開發模式演進

### Phase 1：純手工開發

- 基礎架構、Phase 1 MVP、P0/P1/P2 功能  

### Phase 2：Copilot Agent 協作

- 效能優化（PR #11）、Realtime（PR #12）、AI 設定升級（PR #13）  
- Sidebar / skeleton / error boundary（PR #5, #7）  

### Phase 3：Cursor + Copilot 混合

- Sprint 3/4、Landing/Terms/Privacy、技術債務優化、Vercel 遷移與文件  

---

## 重要決策記錄

| 日期       | 決策                     | 理由                 | 影響                 |
|------------|--------------------------|----------------------|----------------------|
| 2026-02-17 | 採用 Supabase Realtime   | 即時更新對話列表     | 提升體驗、減少手動重整 |
| 2026-02-17 | 引入 GitHub Copilot Agent| 加速開發與優化       | 多個 PR 快速完成     |
| 2026-02-17 | 計畫採用 Lemon Squeezy   | 降低金流門檻、加速上線 | Terms/Privacy 已就緒 |
| 2026-02-18 | 實施技術債務優化         | 生產環境穩定性       | 安全、可靠、效能提升 |
| 2026-02-18 | 採用 Upstash Redis     | 分散式狀態與快取     | 支援多實例、冪等與限流 |
| 2026-02-18 | 部署遷移至 Vercel        | 取代 Railway         | 單一部署、文件更新   |

---

## 統計數據

- **開發天數**：約 2 天（2026-02-17 ~ 2026-02-18）
- **總 Commits**：50+
- **主要功能**：20+
- **Sprint 完成**：4（Sprint 3、Sprint 4 等）
- **GitHub PR**：多個（含 Copilot #5, #7, #11, #12, #13）
- **測試**：API E2E 腳本 + 24 步 Playwright UI 測試

---

## 下一階段計劃

### Phase 3：訂閱系統上線

- [ ] Lemon Squeezy 整合  
- [ ] Webhook 處理、訂閱狀態同步  
- [ ] 付費功能限制  

### Phase 4：生產環境優化

- [ ] Vercel 上設定 UPSTASH_REDIS_REST_URL、UPSTASH_REDIS_REST_TOKEN（選用）  
- [ ] 環境變數與監控、日誌、錯誤追蹤（如 Sentry）  

### Phase 5：Beta 與發布

- [ ] 招募測試用戶、收集反饋  
- [ ] 優化核心流程、準備正式發布  

---

**最後更新**：2026-02-18  
**最新 Commit**：49bd729  
**當前狀態**：技術債務優化完成，正式環境為 Vercel，準備配置 KV 與訂閱流程  
