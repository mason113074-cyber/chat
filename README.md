# CustomerAIPro - AI 智能客服平台

CustomerAIPro 是整合 **LINE**、**OpenAI GPT-4o-mini**、**Supabase** 的 AI 智能客服 SaaS；部署於 **Vercel**，程式碼在 **GitHub**，可選 **Upstash Redis** 做冪等與限流。

## 功能特色

- 🤖 **AI 智能回覆**：OpenAI GPT-4o-mini 自動回覆客戶訊息
- 💬 **LINE 整合**：LINE Messaging API Webhook
- 📊 **對話記錄**：對話儲存於 Supabase
- 🎨 **現代化介面**：Next.js App Router + Tailwind CSS

## 技術架構

| 項目 | 技術 |
|------|------|
| 前端 | Next.js 16 (App Router)、TypeScript、Tailwind CSS |
| 資料庫／認證 | Supabase (PostgreSQL + Auth) |
| AI | OpenAI GPT-4o-mini |
| Redis（選用） | Upstash Redis（冪等、rate limit、快取；未設則記憶體 fallback） |
| 部署 | Vercel（連線 GitHub，push main 自動部署） |
| 訊息平台 | LINE Messaging API |

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製 `.env.example` 為 `.env.local` 並填入設定（詳見 [部署與環境 FAQ](docs/DEPLOYMENT_AND_ENV_FAQ.md)）：

```bash
cp .env.example .env.local
```

**必填**：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY`。  
**LINE**：使用 LINE 時需 `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_OWNER_USER_ID`。  
**選填**：`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`（未設則記憶體 fallback）。

### 3. 連通檢查（本機）

```bash
npm run check-connections
```

會檢查 GitHub remote、Vercel 環境、Supabase 與 Upstash 變數／連線。

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 部署（GitHub + Vercel）

- **Repo**：`mason113074-cyber/chat`，分支 **main**
- **Vercel**：連線上述 GitHub repo，push main 即自動 build 與部署
- **正式站**：https://www.customeraipro.com
- 環境變數在 **Vercel 專案 → Settings → Environment Variables** 設定，與 `.env.example` 對齊（Supabase、LINE、OpenAI、Upstash、`NEXT_PUBLIC_SITE_URL` 等）

詳見 [docs/DEPLOYMENT_AND_ENV_FAQ.md](docs/DEPLOYMENT_AND_ENV_FAQ.md)。

## 環境變數對照

| 用途 | 變數 | 必填 |
|------|------|------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| LINE | `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_OWNER_USER_ID` | 用 LINE 時 |
| OpenAI | `OPENAI_API_KEY`（另有 `OPENAI_MONTHLY_BUDGET` 等，見 .env.example） | ✅ |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 選用 |
| 站點 | `NEXT_PUBLIC_SITE_URL` | 建議 |

完整清單與說明見 `.env.example` 與 [部署與環境 FAQ](docs/DEPLOYMENT_AND_ENV_FAQ.md)。

## LINE Webhook

1. [LINE Developers Console](https://developers.line.biz/) 建立 Messaging API Channel
2. Webhook URL：`https://www.customeraipro.com/api/webhook/line`（或你的網域）
3. 將 Channel Secret、Access Token、擁有者 User ID 填入環境變數

## 授權

MIT License
