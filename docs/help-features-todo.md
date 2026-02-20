# CustomerAIPro Help Center 程式碼功能待辦清單

## 🎯 Phase 2 功能優化

### ✅ 已完成
- [x] Help Center 基礎架構（6 分類、26 篇文章）
- [x] 分類頁面路由（`/help/[category]/page.tsx`）
- [x] 文章頁面路由（`/help/[category]/[article]/page.tsx`）
- [x] 中英雙語翻譯
- [x] 麵包屑導航
- [x] 文章列表顯示
- [x] Help 主頁客戶端搜尋（即時搜尋標題）

---

### 🔍 功能 1：Help Center 搜尋強化（可選）
- 搜尋範圍擴展至內文摘要
- 鍵盤快捷鍵 Cmd/Ctrl+K 開啟搜尋
- 高亮關鍵字
- **預估**：1–2 小時

---

### 👍 功能 2：文章評分系統
- **檔案**：`components/help/ArticleFeedback.tsx`、`app/api/help/feedback/route.ts`
- 按鈕：「有幫助」👍 / 「沒幫助」👎，點擊後顯示感謝、避免重複（localStorage）
- 記錄：文章 slug、評分、時間戳；後台可查有用率
- **預估**：2 小時

---

### 🔗 功能 3：相關文章推薦
- **檔案**：`components/help/RelatedArticles.tsx`、`lib/help-articles.ts` 新增 `getRelatedArticles(categorySlug, articleSlug, limit)`
- 顯示 3 篇相關文章（優先同分類，排除當前文章）
- **預估**：1–1.5 小時

---

### 📱 功能 4：手機版優化
- &lt; 768px 單欄、搜尋全寬、文章字體 16px→18px
- **預估**：1.5 小時

---

### 🏷️ 功能 5：標籤系統（可選）
- 文章 `tags`、`TagFilter`、`/help/tags/[tag]`
- **預估**：3 小時

---

### 🌐 功能 6：SEO 優化
- 每篇文章 `generateMetadata`（title、description、og:image）
- Sitemap 含 Help 頁、robots.txt、JSON-LD Article schema
- **預估**：2 小時

---

### 📊 功能 7：Analytics 追蹤
- 事件：`help_article_view`、`help_search`、`help_feedback`、`help_related_click`
- **預估**：1.5 小時

---

### 🎨 功能 8：深色模式（可選）
- `dark:` Tailwind、ThemeToggle、localStorage
- **預估**：2–3 小時

---

## 📅 建議實施順序

**Week 1**：評分系統 → 相關文章推薦 → 搜尋強化  
**Week 2**：手機版優化 → SEO → Analytics  
**Week 3（選做）**：標籤系統、深色模式

---

## 🧪 測試要點
- 搜尋：中英文、無結果提示、快捷鍵、跳轉正確
- 評分：感謝訊息、防重複、API 儲存、後台統計
- 相關文章：同分類 3 篇、排除當前、少於 3 篇時補其他分類

---

## 📈 成功指標（1 個月後）
| 指標 | 目標 |
|------|------|
| 文章瀏覽數 | 500+ |
| 搜尋使用率 | 30%+ |
| 文章有用率 | 85%+ |
| 相關文章點擊率 | 15%+ |
