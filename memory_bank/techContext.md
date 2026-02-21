# 技術架構

## Stack
- Frontend + Backend：Next.js 16.1.6（App Router）
- 資料庫 + 認證：Supabase（PostgreSQL + Auth + RLS）
- AI：OpenAI GPT-4o-mini（可切換模型）
- 聊天整合：LINE Messaging API（Webhook）
- UI 元件：shadcn/ui + Tailwind CSS
- 語言：TypeScript
- 部署：Vercel（從 GitHub main 分支自動部署）
- 網域：GoDaddy → DNS 指向 Vercel

## 資料庫 Migration
- 001~009：基礎表 + conversations status 欄位
- 010：contact_tags + contact_tag_assignments

## 認證機制
- 瀏覽器：Cookie 認證（Supabase Auth）
- API 測試：Bearer token 認證

## Dashboard 導航架構（Sprint A，高優先級）
- **左側 Sidebar**：取代頂部 Nav，固定左側 240px（展開）/ 64px（收合）
- **TopBar**：搜尋 ⌘K + 語言切換 + 用戶頭像，高度 56px
- **收合狀態**：localStorage `dashboard-sidebar-expanded` 持久化
- **手機版**：漢堡選單打開左側抽屜（240px）
- **導航項目**：總覽、對話紀錄、客戶聯絡人、知識庫、數據分析、設定、方案與計費、系統測試
- **元件**：`Sidebar.tsx`、`DashboardTopBar.tsx`、`DashboardLayoutClient.tsx`（不再使用 `DashboardNav`）
