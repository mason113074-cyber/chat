# CustomerAIPro - AI 智能客服平台

CustomerAIPro 是一個整合 LINE、OpenAI GPT-4o-mini 和 Supabase 的 AI 智能客服平台。

## 功能特色

- 🤖 **AI 智能回覆**：使用 OpenAI GPT-4o-mini 模型自動回覆客戶訊息
- 💬 **LINE 整合**：支援 LINE Messaging API Webhook
- 📊 **對話記錄**：所有對話自動儲存到 Supabase 資料庫
- 🎨 **現代化介面**：使用 Next.js 14 App Router + Tailwind CSS

## 技術架構

- **前端框架**: Next.js 14+ (App Router)
- **程式語言**: TypeScript
- **樣式**: Tailwind CSS
- **AI 模型**: OpenAI GPT-4o-mini
- **資料庫**: Supabase
- **訊息平台**: LINE Messaging API

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env.local` 並填入相關設定：

```bash
cp .env.example .env.local
```

### 3. 設定 Supabase

在 Supabase 建立 `conversations` 資料表：

```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'line',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 環境變數說明

| 變數名稱 | 說明 |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開金鑰 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服務角色金鑰 |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `OPENAI_API_KEY` | OpenAI API 金鑰 |
| `NEXT_PUBLIC_SITE_URL` | 網站 URL |

## LINE Webhook 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Messaging API Channel
3. 設定 Webhook URL 為：`https://your-domain.com/api/webhook/line`
4. 啟用 Webhook
5. 將 Channel Secret 和 Channel Access Token 填入環境變數

## 專案結構

```
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── line/
│   │           └── route.ts    # LINE Webhook 處理
│   ├── globals.css             # 全域樣式
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # 首頁
├── lib/
│   ├── line.ts                 # LINE SDK 工具
│   ├── openai.ts               # OpenAI Client
│   └── supabase.ts             # Supabase Client
├── .env.example                # 環境變數範例
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 授權

MIT License
