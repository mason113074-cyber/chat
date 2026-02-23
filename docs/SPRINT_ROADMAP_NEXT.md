# 🗺️ 下一期 Sprint Roadmap

按 **商業價值 × 技術難度** 排序：

## Sprint 5：上線前收尾（本週 2-3 天）

| # | 任務 | 類型 | 工作量 | 說明 |
|---|------|------|--------|------|
| 1 | **PR merge + Production 驗證** | 🔴 必做 | 30 分 | 跑完上面清單，合併 main |
| 2 | **Supabase RLS 政策檢查** | 🔴 安全 | 1h | 確認 knowledge_base / conversations / contacts 都有 RLS，防止用戶 A 看到 B 的資料 |
| 3 | **Error boundary + 全域錯誤頁** | 🟡 體驗 | 45 分 | Dashboard 加 error.tsx，避免白屏 |
| 4 | **README.md + 部署文檔** | 🟡 專業 | 1h | 給客戶/合作者的第一印象 |

## Sprint 6：付費轉換（下週）

| # | 任務 | 類型 | 工作量 | 說明 |
|---|------|------|--------|------|
| 5 | **付款整合（Stripe / 藍新）** | 🔴 變現 | 4h | 免費 → Pro 升級流程 |
| 6 | **用量限制強制執行** | 🔴 變現 | 2h | 免費版 100 則/月 → 超額提示升級 |
| 7 | **Billing Dashboard 接真實數據** | 🟡 信任 | 1.5h | 接 openai_usage 表，取代假資料 |
| 8 | **Supabase Realtime 即時對話** | 🟡 體驗 | 2h | Dashboard 對話頁不用手動刷新 |

## Sprint 7：產品差異化（第三週）

| # | 任務 | 類型 | 工作量 | 說明 |
|---|------|------|--------|------|
| 9 | **知識庫 Embedding 向量搜尋** | 🟡 品質 | 4h | pgvector + OpenAI Embedding 取代 ilike |
| 10 | **AI 回覆品質儀表板** | 🟡 差異化 | 3h | AUTO/SUGGEST/ASK/HANDOFF 比例分析 |
| 11 | **E2E 測試覆蓋** | 🟢 品質 | 3h | Playwright 核心路徑冒煙測試 |
| 12 | **Onboarding 引導流程** | 🟢 轉化 | 4h | 新用戶 5 分鐘完成 Bot 連接 |
