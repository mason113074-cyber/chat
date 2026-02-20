# Test Dashboard 完整文檔與優化指南

本文件說明 CustomerAI Pro 系統測試儀表板（Test Dashboard）的架構、使用方式、測試策略、效能優化與部署驗證。

---

## 已完成的成就

- **模組化元件系統**：12 個獨立、可重用的元件（TestDashboard、TestControlPanel、TestProgressBar、TestSummaryCards、TestResultsList、TestHistoryPanel、TestAlertBanner、StatCard、StatusBadge、ErrorCollapse、TrendChart、types）。
- **型別安全**：完整 TypeScript 型別定義於 `components/dashboard/test-dashboard/types.ts`。
- **可訪問性**：ARIA 屬性（progressbar、aria-label、aria-expanded、role="alert"）、鍵盤可操作、語義化結構。
- **響應式設計**：Mobile / Tablet / Desktop 斷點（grid-cols-1 sm:2 lg:4、flex-col sm:flex-row）。
- **零依賴圖表**：純 CSS 趨勢柱狀圖與 hover tooltip。
- **14 項自動化測試**：API（5）、Database（1）、External（2）、Security（3）、Feature（2）、i18n（1）。
- **歷史與告警**：Supabase `health_check_logs` 持久化、Discord/Slack 告警、Vercel Cron 每 15 分鐘執行。

---

## 測試建議（可選實作）

專案已可選使用 **Vitest** + **@testing-library/react** 進行單元與整合測試，並以 **axe-core** 做可訪問性檢測。

### 優先級 1：關鍵業務邏輯

- **TestDashboard**：mock `global.fetch`，驗證初始渲染、點擊「Run All Tests」後按鈕 disabled 與 progressbar 出現、跑完後摘要卡片（Total/Passed/Failed）顯示。測試檔：`components/dashboard/test-dashboard/__tests__/TestDashboard.test.tsx`。

### 優先級 2：原子元件

- **StatCard**：驗證 title、value 顯示與 variant 對應的 class（如 `border-green-200`）。測試檔：`components/dashboard/shared/__tests__/StatCard.test.tsx`。
- **StatusBadge**：驗證各 status 的 icon 與 aria-label。測試檔：`components/dashboard/shared/__tests__/StatusBadge.test.tsx`。

### 優先級 3：可訪問性

- 使用 **axe-core**：在測試中對容器執行 `axe.run(container)`，assert 無 violations。
- **TestProgressBar**：驗證 `aria-valuenow`、`aria-valuemin`、`aria-valuemax`。測試檔：`components/dashboard/test-dashboard/__tests__/TestDashboard.a11y.test.tsx`。

執行指令：`npm run test:unit:run`。

---

## 效能優化建議

- **動態載入歷史面板**：使用 `next/dynamic` 載入 `TestHistoryPanel`，`ssr: false`，以減少初始 bundle。
- **React.memo**：對 `TestResultsList`、`CategorySection`、`TestItem` 及可選的 `TestSummaryCards`、`TestAlertBanner`、`TestProgressBar` 使用 `memo`，減少父層 state 更新時的重繪。
- **虛擬化**：目前僅 14 項測試，不需虛擬化。若未來測試項目超過約 50 項，可考慮使用 `react-window` 等虛擬列表。

---

## 可訪問性檢查清單

### 自動化工具

- **axe DevTools**（Chrome 擴充）：掃描頁面並檢視違規。
- **WAVE**：https://wave.webaim.org/ ，輸入測試頁 URL。
- **Lighthouse**（Chrome DevTools）：Performance + Accessibility 報告。

### 手動檢查

- 鍵盤導航：Tab 可遍歷所有互動元素。
- 焦點指示：可聚焦元素有明顯 focus ring（如 `focus:ring-2`）。
- 顏色對比：文字與背景對比度 ≥ 4.5:1（WCAG AA）。
- 螢幕閱讀器：以 NVDA/JAWS 測試流程。
- 觸控目標：按鈕至少約 44×44px（本專案 `py-3 px-6` 已符合）。
- 語義化：正確使用 `<button>`、標題階層、section/header。

---

## 效能基準

建議以 Lighthouse 測量下列指標（於 Production 或 staging 環境）：

| 指標 | 目標值 |
|------|--------|
| FCP (First Contentful Paint) | < 1.8s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TBT (Total Blocking Time) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Accessibility Score | ≥ 95 |

操作：Chrome DevTools → Lighthouse → 選擇 Performance + Accessibility → Analyze page load。

---

## 部署後驗證清單

### 功能

- 訪問 `/dashboard/system-test`。
- 點擊「Run All Tests」，確認 14 項依序執行、進度 0% → 100%。
- 摘要卡片與分類結果正確；可展開/收合分類、可點「查看錯誤」顯示詳情。
- 切換歷史 7/30/90 天，趨勢圖與近期失敗記錄正常。
- 中英文切換正常。

### 響應式

- Mobile（約 375px）：單欄、按鈕全寬。
- Tablet（約 768px）：2 欄網格。
- Desktop（約 1440px）：4 欄網格。

### 瀏覽器

- Chrome、Safari、Firefox、Edge（latest）各驗證基本流程。

---

## 團隊使用文檔

### 如何新增測試項目

1. 在 `components/dashboard/test-dashboard/TestDashboard.tsx` 的 `runAllTests` 中，於現有 `run(...)` 序列中新增一筆。
2. 撰寫對應的 async 函數（例如 `testNewFeature`），內部使用 `fetch` 呼叫目標 API，`if (!res.ok) throw new Error(...)`。
3. 若新測試屬於新分類，需在 `types.ts` 的 `TestCategory` 與 `CATEGORY_ORDER` 中加入，並在 `messages/zh-TW.json`、`messages/en.json` 的 `systemTest.categories` 新增翻譯。

範例：

```typescript
await run('New Feature', 'Feature', async () => {
  const res = await fetch('/api/new-feature', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});
```

### 如何自訂樣式

- 元件使用 Tailwind 工具類。若要統一品牌色，可在 `tailwind.config.js` 的 `theme.extend.colors` 中定義（例如 `brand.primary`），再將元件內的 `bg-indigo-600` 改為 `bg-brand-primary`。

### 如何在其他頁面重用元件

- `StatCard`、`StatusBadge`、`ErrorCollapse`、`TrendChart` 均為獨立元件，可直接 import 使用：

```typescript
import { StatCard } from '@/components/dashboard/shared/StatCard';
import { StatusBadge } from '@/components/dashboard/shared/StatusBadge';

<StatCard title="Active Users" value={1234} variant="success" />
<StatusBadge status="success" />
```

---

## LemonSqueezy 審核準備

可提供以下說明與證據：

1. **自動化測試覆蓋**：14 項自動化測試，涵蓋 API、資料庫、外部服務、安全、功能、i18n。
2. **定時監控**：Vercel Cron 每 15 分鐘執行健康檢查，結果寫入 `health_check_logs`。
3. **告警機制**：失敗時可透過 Discord/Slack Webhook 通知。
4. **歷史趨勢**：儀表板可顯示 7/30/90 天成功率趨勢與近期失敗記錄。
5. **截圖建議**：提供 `/dashboard/system-test` 的完整畫面截圖（含摘要與歷史），以及（若適用）Lighthouse Accessibility 報告。

範例說明段落：

```markdown
# CustomerAI Pro - 系統健康監控

## 自動化測試覆蓋
- 14 項自動化測試
- 每 15 分鐘執行一次（Cron）
- 可追蹤 7/30/90 天平均成功率

## 監控範圍
- API Endpoints (5)、資料庫連線 (1)、外部服務 (2)、安全機制 (3)、核心功能 (2)、國際化 (1)

## 告警機制
- Discord/Slack 即時通知（可選）
- 失敗記錄寫入資料庫
- 歷史趨勢圖表

## 測試儀表板
- 路徑：/dashboard/system-test
- 截圖：[附上儀表板與歷史區塊]
```
