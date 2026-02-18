# 技術架構

## Stack
- Frontend + Backend：Next.js 16.1.6（App Router）
- 資料庫 + 認證：Supabase（PostgreSQL + Auth + RLS）
- AI：OpenAI GPT-4o-mini（可切換模型）
- 聊天整合：LINE Messaging API（Webhook）
- UI 元件：shadcn/ui + Tailwind CSS
- 語言：TypeScript
- 部署：Railway（從 GitHub main 分支自動部署）
- 網域：GoDaddy → DNS 指向 Railway

## 資料庫 Migration
- 001~009：基礎表 + conversations status 欄位
- 010：contact_tags + contact_tag_assignments

## 認證機制
- 瀏覽器：Cookie 認證（Supabase Auth）
- API 測試：Bearer token 認證
