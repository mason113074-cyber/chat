# CustomerAIPro — GitHub 專案總覽（Notion 同步用）

> 本文件為 GitHub 專案之結構化整理，可整份複製貼到 Notion 或透過 Notion 匯入 Markdown 使用。  
> **維護原則**：每次完成任務並 push 到 GitHub 後，請同步更新此文件（或 Notion 上的對應頁面）。

**最後更新**：依 repo 實際狀態為準（建議在 Notion 標註「與 GitHub 同步日期」）。

---

## 如何把本頁放到 Notion

1. **複製貼上**：在編輯器打開本檔案 → 全選（Ctrl+A）→ 複製（Ctrl+C）→ 在 Notion 新增一個 Page → 貼上（Ctrl+V）。標題、表格、列表會保留。
2. **匯入 Markdown**：Notion 左側選 **Import** → **Markdown & CSV** → 選擇本專案的 `docs/NOTION_SYNC.md` 匯入。

---

## 一、專案概述（由上而下）

| 項目 | 說明 |
|------|------|
| **產品名稱** | CustomerAIPro — AI 智能客服 SaaS |
| **一句話** | 整合 LINE、OpenAI GPT-4o-mini、Supabase 的 AI 智能客服平台，部署於 Vercel |
| **正式網址** | https://www.customeraipro.com |
| **GitHub** | mason113074-cyber/chat |
| **部署** | Vercel（連線 GitHub，push main 自動部署） |
| **語言** | TypeScript，UI 全繁體中文 |

### 核心功能（依使用者流程）

1. **LINE 整合** — LINE Messaging API Webhook（單 bot + 多 bot 路由）
2. **AI 智能回覆** — OpenAI GPT-4o-mini，系統提示 + 知識庫 RAG，決策層 AUTO/SUGGEST/ASK/HANDOFF
3. **知識庫** — 上傳、CRUD、匯入（TXT/CSV/URL）、搜尋、測試 AI 回答、Gap 分析
4. **對話與聯絡人** — 對話記錄、聯絡人、標籤、建議草稿一鍵送出
5. **儀表板** — 數據分析、帳單、設定、活動（Campaigns）、工作流程（Automations）、系統檢測
6. **Help 中心** — 多語系（en / zh-TW），26+ 文章、6 分類

---

## 二、技術架構（邏輯順序）

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 16 (App Router)、TypeScript、Tailwind CSS、next-intl |
| 後端 API | Next.js App Router API Routes（/app/api/） |
| 資料庫／認證 | Supabase（PostgreSQL、Auth、RLS） |
| AI | OpenAI GPT-4o-mini |
| 訊息平台 | LINE Messaging API、LINE Login（綁定） |
| Redis（選用） | Upstash Redis（冪等、rate limit、快取；未設則記憶體 fallback） |
| 部署 | Vercel |

### 方案與限制（lib/plans.ts）

| 方案 | 對話/月 | 知識庫條數 |
|------|---------|------------|
| Free | 50 | 10 |
| Basic | 500 | 100 |
| Pro | 5000 | 500 |
| Enterprise | 無限 | 無限 |

---

## 三、程式碼結構（目錄樹邏輯）

```
chat/
├── app/
│   ├── [locale]/                    # 多語系路由（zh-TW, en）
│   │   ├── page.tsx                 # 首頁
│   │   ├── login, forgot-password, terms, privacy, pricing
│   │   ├── demo, support, docs
│   │   ├── help/                    # Help 中心（[category]/[article]）
│   │   └── dashboard/               # 需登入
│   │       ├── page.tsx             # 儀表板首頁
│   │       ├── onboarding, knowledge-base, analytics
│   │       ├── conversations, conversations/[contactId]
│   │       ├── contacts, billing, campaigns, automations
│   │       ├── settings, settings/bots
│   │       ├── ai-quality, system-test
│   ├── api/                         # 後端 API（見下一節）
│   └── components/                 # Landing 等
├── components/                      # 共用元件（Toast, EmptyState, LocaleSwitcher, dashboard 共用…）
├── lib/                             # 工具、AI 決策、LINE client、加密、知識庫搜尋、工作流程引擎
├── messages/                        # i18n JSON（en.json, zh-TW.json）
├── supabase/migrations/             # 001～029（DB schema）
├── e2e/                             # Playwright E2E
├── docs/                            # 說明與報告（本文件在此）
└── memory-bank/                     # 專案脈絡、tasks、progress、archive
```

---

## 四、API 端點一覽（依功能分組）

### 認證 / Auth
- `GET /api/auth/line` — LINE OAuth 登入
- `GET /api/auth/line/callback` — LINE 綁定 callback
- `POST /api/auth/line/unbind` — 解除 LINE 綁定

### 設定
- `GET/POST /api/settings` — 使用者設定
- `GET/PUT /api/settings/line` — LINE Channel 設定
- `POST /api/settings/line/test` — 測試 LINE 連線
- `GET/POST /api/settings/bots` — 多 Bot 列表/新增
- `PUT /api/settings/bots/[id]` — 更新 Bot（含重新產生 webhook key）
- `POST /api/settings/bots/test`、`/api/settings/bots/[id]/test` — 測試 Bot
- `POST /api/settings/preview` — 設定預覽

### 知識庫
- `GET/POST /api/knowledge-base` — 列表/新增
- `GET/PUT/DELETE /api/knowledge-base/[id]` — 單筆
- `POST /api/knowledge-base/import` — 批次匯入
- `POST /api/knowledge-base/import-url` — URL 匯入
- `GET /api/knowledge-base/stats` — 統計
- `GET /api/knowledge-base/search` — 搜尋
- `POST /api/knowledge-base/test` — 測試 AI 回答
- `GET /api/knowledge-base/gap-analysis` — Gap 分析
- `POST /api/knowledge-base/from-conversation` — 從對話產生知識

### Webhook / 聊天
- `POST /api/webhook/line` — 單 bot LINE Webhook
- `POST /api/webhook/line/[botId]/[webhookKey]` — 多 bot Webhook
- `POST /api/chat` — 儀表板內建聊天
- `POST /api/chat` — 儀表板內建聊天（登入後測試 AI 回覆）

### 聯絡人與標籤
- `GET /api/contacts`、`GET /api/contacts/[id]`
- `GET/POST /api/contacts/tags`、`PATCH/DELETE /api/contacts/tags/[id]`
- `POST/DELETE /api/contacts/[id]/tags`、`/api/contacts/[id]/tags/[tagId]`
- `GET /api/tags`

### 對話與建議
- `GET /api/conversations/counts`
- `GET/POST /api/conversations/[id]/suggestions` — 建議草稿
- `GET /api/conversations/[id]/suggestions/[suggestionId]`
- `POST /api/suggestions/[id]/send` — 一鍵送出草稿
- `POST /api/conversations/[id]/reply` — 手動回覆
- `POST /api/conversations/[id]/handback`、`takeover`
- `POST /api/conversations/[id]/tags`、`/api/conversations/batch`
- `GET /api/conversations/[id]/status`

### 分析與帳單
- `GET /api/analytics/overview`、trends、resolution、quality、daily-trend、hourly、top-contacts、top-questions、export
- `GET /api/billing/usage`
- `GET /api/onboarding/status`、`POST /api/onboarding/save`

### 工作流程與其他
- `GET/POST /api/workflows`、`GET/PUT/DELETE /api/workflows/[id]`
- `POST /api/workflows/[id]/execute`、`GET /api/workflows/[id]/logs`
- `GET/POST /api/campaigns`、`/api/campaigns/[id]`
- `GET /api/plans`、`/api/usage`、`/api/subscription`、`/api/payments`
- `GET /api/search`
- 健康檢查：`/api/health-check`、`/api/health/supabase`、`/api/health/openai`、`/api/health/security/*`、`/api/health/i18n`、`/api/health/feature/handoff`

---

## 五、資料庫與 Migrations（順序）

- **001～015** — 使用者、聯絡人、對話、訂閱、知識庫、標籤、帳單、onboarding、索引、監控、儀表板統計
- **016～025** — 知識庫優化、方案、健康檢查、LINE 登入綁定、AI 回覆、CRM、工作流程
- **026～028** — 工作流程、Campaigns、Crisp 相關、notes、ticketing、api_keys、routing、branding
- **029** — ⚠️ 目前以 **029_multibot_copilot** 為準（line_bots、webhook_events、ai_suggestions：suggested_reply、status draft/sent、bot_id、event_id、sent_by）。舊版 029_ai_copilot_suggestions 已備援（.bak），新環境勿重跑舊版。

主要表：`users`、`contacts`、`conversations`、`knowledge_base`、`ai_suggestions`、`line_bots`、`webhook_events`、`workflows`、`workflow_logs`、`campaigns` 等；RLS 以 `auth.uid() = user_id` 或透過關聯表限制。

---

## 六、現狀與已知風險（簡表）

| 項目 | 狀態／備註 |
|------|------------|
| 多 Bot Webhook | ✅ 已實作（/api/webhook/line/[botId]/[webhookKey]），需 LINE_BOT_ENCRYPTION_KEY |
| AI Copilot 決策層 | ✅ AUTO/SUGGEST/ASK/HANDOFF，高風險不 AUTO，草稿可稽核 |
| 建議草稿 UI | ✅ 對話詳情頁串接 suggestions，一鍵送出 |
| Settings 多 Bot UI | ✅ 有 /dashboard/settings/bots（列表、新增、編輯、刪除、測試） |
| Knowledge Base 頁面 | ✅ 已拆分元件（Phase 1+2）：Stats、Toolbar、List、TestPanel、GapAnalysis、AddEditModal、ImportModal、UrlImportModal |
| Settings 頁面 | ✅ 已拆分：General、Integrations、Personality、Behavior、Experience、Optimize、LINE Modal、Live Preview |
| ai_suggestions schema | ⚠️ 以 029_multibot 為準；若 DB 曾跑舊版需 forward-only migration 收斂 |
| WorkflowEngine 回覆 | ✅ 已支援傳入 credentials，多 bot 觸發時回覆走該 bot 憑證 |
| 安全性修復（P0/P1/P2） | ✅ 已完成（/api/chat 需驗證、idempotency+botId、KB 搜尋限制 200 筆、加密驗證、回覆延遲上限等） |
| Guardrail 退錢+訂單 | ✅ 已放行結構化退費請求（退錢/退款+訂單語境可走 KB+SUGGEST 產 draft） |
| 測試 | 單元：reply-decision、knowledge-search-tokenize、StatusBadge、StatCard、TestDashboard；E2E：auth、smoke、full-flow-production、automations 等；缺口：webhook 整合、多 bot 路徑、Guardrail 邊界 |

---

## 七、開發規範（快速查）

- **UI 文字**：繁體中文，i18n 用 next-intl（messages/zh-TW.json、en.json）
- **API**：路由在 `/app/api/`，回傳 `NextResponse.json()`，錯誤 try/catch + console.error
- **認證**：Supabase Auth（Cookie + Bearer），RLS 保護資料
- **Commit**：`類型: 描述`（如 `Fix: xxx`、`Sprint5: xxx`）
- **環境變數**：參考 `.env.example`，不 hardcode；多 Bot 需 `LINE_BOT_ENCRYPTION_KEY`
- **AI 副駕**：遵守 `.cursor/rules/ai-copilot-policy.mdc`（高風險不 AUTO、草稿須可稽核）

---

## 八、完成任務後的檢查清單（GitHub + Notion）

每次完成開發或修復後，請依序：

1. **本地驗證**  
   - `npx tsc --noEmit`  
   - `npm run build`（必要時跑 `npm run test` / E2E）

2. **Git**  
   - `git add -A`（或只 add 相關檔案）  
   - `git commit -m "類型: 簡短描述"`  
   - `git push origin <分支名>`

3. **Notion**  
   - 更新 Notion 上對應本專案的頁面（或本文件 `docs/NOTION_SYNC.md`）：  
     - 若為功能/結構變更：更新「專案概述」「程式碼結構」「API 端點」「現狀與已知風險」中相關段落。  
     - 若為修復/上線：更新「現狀與已知風險」或「最後更新」日期。  
   - 若 Notion 是從本文件複製貼上：在 repo 更新 `docs/NOTION_SYNC.md` 後，再貼到 Notion 覆蓋或手動同步變更段落。

---

## 九、相關文件索引（repo 內）

| 文件 | 用途 |
|------|------|
| README.md | 專案說明、快速開始、部署、環境變數 |
| docs/PROJECT_STRUCTURE.md | 目錄樹、前後端架構、設定檔 |
| docs/API_ENDPOINTS.md | API 完整列表與說明 |
| docs/REPO_STATUS_REPORT.md | 現狀盤點、migrations、API、風險、測試 |
| docs/SPRINT_ROADMAP_NEXT.md | 下一期 Sprint 任務 |
| docs/AI_COPILOT_POLICY.md | AI 副駕產品規則 |
| docs/DEPLOYMENT_AND_ENV_FAQ.md | 部署與環境變數 FAQ |
| memory-bank/projectbrief.md | 專案 brief、優先級 |
| .cursor/rules/project-context.mdc | 產品、技術、API、方案限制（alwaysApply） |
| .cursor/rules/ai-copilot-policy.mdc | AI 副駕工程規則（alwaysApply） |
| .cursor/rules/github-and-notion-workflow.mdc | 完成任務後 GitHub + Notion 同步流程 |
| scripts/notion-insert-row.ts | 以自然語言屬性插入 Notion 資料庫一列（屬性名稱匹配與驗證） |

### 指令列：插入 Notion 資料庫一列

使用 `scripts/notion-insert-row.ts` 可依「自然語言」屬性名稱插入一筆資料庫列，會自動匹配屬性名稱（不區分大小寫、去空白）並依類型驗證與轉換：

```bash
# 需先設定 NOTION_API_KEY（.env.local 或環境變數）
npx tsx scripts/notion-insert-row.ts "<database_id 或 Notion 資料庫 URL>" "Title=我的標題" "Status=Done"
# 或 JSON
npx tsx scripts/notion-insert-row.ts "<database_id>" '{"Title":"我的標題","Status":"Done"}'
```

支援類型：title、rich_text、number、select、multi_select、date、checkbox、url、email、phone_number。

---

## 十、Notion Second Brain Hub

- **主索引頁**：[🧠 CustomerAI Pro — Second Brain Hub](https://www.notion.so/310de94875b581a1b80ef8f44e7e3606)
- **開發日記資料庫**：📓 Cursor AI Dev Diary（DB ID: `3dcdf229ea164a9b90c24789c31f4de1`）
  - 欄位：Title / Date / Sprint / Task / Status / Commit / Notes / Created
  - 已記錄：Settings Phase 2 ✅、KB Phase 1 ✅
- **同步規則**：每完成一個 Cursor AI 工作階段，寫一筆日記到此資料庫。

---

*此文件為「GitHub → Notion」單一來源整理，請與 repo 同步維護。*
