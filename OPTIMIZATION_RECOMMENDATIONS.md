# CustomerAIPro 優化建議

## 生成日期

2025-02-19

## 短期建議（1 個月內）

1. **啟用 Dashboard RPC**
   - 在 Supabase SQL Editor 執行 `supabase/migrations/015_get_dashboard_stats.sql`
   - 將 `app/dashboard/page.tsx` 改為呼叫 `supabase.rpc('get_dashboard_stats', { p_user_id: user.id })` 取代現有 4 個並行查詢中的前 3 個統計查詢，可再減少往返與計算時間

2. **快取策略**
   - 對 Dashboard 統計、Contacts 列表等可考慮使用 React Query / SWR 做 client 快取（staleTime 約 1–5 分鐘），減少重複請求

3. **Console 與 Network 檢查**
   - 在正式／預覽環境確認無多餘 `console.error`、無 404/500，Supabase 請求回應時間合理（例如 < 500ms）

## 中期建議（3 個月內）

1. **Conversations 頁面模組化**
   - 將 `app/dashboard/conversations/page.tsx` 拆成：ConversationList、ChatWindow、MessageBubble、MessageInput 等元件，以及 useConversations、useMessages 等 hooks，以利維護與測試

2. **Contacts API 分頁**
   - 在 `GET /api/contacts` 支援 `page`、`limit`（或 `offset`/`limit`）參數，改為伺服器端分頁，以支援大量聯絡人時之效能與擴充性

3. **Analytics 圖表**
   - 若資料點很多，可考慮虛擬化或取樣，或改用 Recharts 等函式庫的 ResponsiveContainer，以兼顧響應式與效能

4. **型別與錯誤訊息**
   - 建立共用型別（如 `types/database.ts`）與錯誤訊息常數（如 `constants/errorMessages.ts`），統一繁體中文錯誤文案

## 長期建議（6 個月以上）

1. **自動化測試**
   - 為關鍵流程撰寫 E2E（Playwright/Cypress）與重要邏輯的單元測試（例如 Dashboard 統計、Conversations 載入與錯誤處理）

2. **狀態管理**
   - 若跨頁／跨元件狀態變多，可考慮 Zustand 或 Jotai 集中管理，避免 prop drilling

3. **API 層抽象**
   - 將 Supabase 查詢封裝成 `lib/api/` 下的模組（如 `conversations.ts`、`contacts.ts`），方便複用、mock 與測試

4. **環境變數驗證**
   - 使用 Zod 等在啟動時驗證 `process.env`，避免缺少必要變數時難以除錯

## 技術債務清單

- [ ] 統一 API 端點命名與錯誤格式
- [ ] 完善 TypeScript 型別，減少 `any`
- [ ] 錯誤訊息國際化／常數化（繁體中文）
- [ ] 實作快取機制（React Query/SWR）
- [ ] 圖片優化（Next.js Image、縮圖）
- [ ] 搜尋優化（Supabase full-text 或專用搜尋）
- [ ] 測試覆蓋率目標（例如 80%）

## 相關檔案

- 測試報告：`TEST_REPORT.md`
- Dashboard 統計 RPC：`supabase/migrations/015_get_dashboard_stats.sql`
- 空狀態元件：`components/EmptyState.tsx`
