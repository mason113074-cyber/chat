# 虛擬用戶稽核報告 — CustomerAI Pro 網站

**日期**：2026-02-23  
**範圍**：https://www.customeraipro.com（繁體中文 zh-TW 為主）  
**方式**：以虛擬用戶走訪各頁面、功能與幫助文章，記錄問題並提出改善建議。

---

## 一、已走訪頁面與狀態

| 頁面 | 路徑 | 狀態 | 備註 |
|------|------|------|------|
| 首頁 | /zh-TW | ✅ 正常 | 功能展示、定價、FAQ、CTA 皆可讀 |
| 登入 | /zh-TW/login | ✅ 正常 | Email/密碼、忘記密碼、LINE 登入、註冊連結 |
| 註冊 | /zh-TW/login?signup=true | ⏳ Loading | 未登入時會載入，需實際操作確認表單 |
| 忘記密碼 | /zh-TW/forgot-password | ✅ 正常 | 表單與寄送重設連結流程 |
| Dashboard | /zh-TW/dashboard | 🔒 需登入 | 未登入顯示 Loading 後應導向登入 |
| 幫助中心 | /zh-TW/help | ✅ 正常 | 分類、搜尋、連結至各分類與文章 |
| 幫助分類 | /zh-TW/help/getting-started 等 | ✅ 正常 | 文章列表與「返回幫助中心」 |
| 幫助文章 | /zh-TW/help/.../welcome 等 | ✅ 正常 | 內文、閱讀時間、更新日、文內連結 |
| 聯繫客服 | /zh-TW/support | ✅ 正常 | Email、LINE、電話（即將推出）、幫助中心連結 |
| Demo | /zh-TW/demo | ↪️ 重導向 | 導向 /zh-TW/help（設計如此） |
| Docs | /zh-TW/docs | ↪️ 重導向 | 導向 /zh-TW/help（設計如此） |

*Dashboard 內功能（對話、聯絡人、知識庫、分析、自動化、行銷、設定、計費、系統測試）需登入後才能逐項操作，本次以 Playbook 與程式碼檢視代替實際點擊。*

---

## 二、已修正項目

### 1. 首頁「使用流程」區塊標題語系

- **問題**：繁體中文站「使用流程」下方大標仍為英文 "How it Works"。
- **修正**：`messages/zh-TW.json` 的 `howItWorksTitle` 改為 **「如何開始」**。

### 2. 幫助文章內連結遺失語系

- **問題**：文章內容為 HTML，內含 `<a href="/help">`、`<a href="/help/...">`。在 zh-TW 或 en 下點擊會跳到無 locale 路徑，可能變成預設語系。
- **修正**：在 `lib/help-articles.ts` 的 `getArticleContent()` 中，依 `locale` 將 `href="/help` 改寫為 `href="/zh-TW/help` 或 `href="/en/help`，點擊後保留當前語系。

### 3. 幫助文章頁麵包屑與文案

- **問題**：文章頁麵包屑第一層為硬編碼 "Help"；閱讀時間、更新時間、「Was this article helpful?」「Yes」「No」未做 i18n。
- **修正**：
  - 麵包屑改為使用 `t('breadcrumb.help')`（幫助中心 / Help Center）。
  - 閱讀時間與更新時間使用 `t('minuteRead')`、`t('lastUpdatedLabel')`。
  - 文末「這篇文章有幫助嗎？」區塊使用 `t('articleHelpful')`、`t('feedbackYes')`、`t('feedbackNo')`。
  - 新增 `messages` 中 `help.lastUpdatedLabel`、`help.articleHelpful`、`help.feedbackYes`、`help.feedbackNo`（zh-TW / en）。

### 4. 幫助文章頁 metadata 語系

- **問題**：`generateMetadata` 的 title 後綴固定為 "Help"。
- **修正**：改為使用 `t('breadcrumb.help')`，使標題依語系顯示「幫助中心」或 "Help Center"。

---

## 三、建議後續改善（未改程式）

1. **「此文是否有幫助」按鈕行為**  
   目前為純 UI，未送後端或分析。若需收集滿意度，可接 API 並在點擊後顯示感謝或引導至支援。

2. **登入／註冊頁 Loading**  
   `/dashboard`、`/login?signup=true` 在未登入時會有一段 "Loading..."。可考慮：
   - 未登入訪問 dashboard 時盡快 302 到登入頁，減少空白等待；
   - 註冊頁若為 SPA 切換，可加上 skeleton 或明確「載入中」文案。

3. **支援頁「電話」**  
   「即將推出」「營業時間」已標示清楚，若之後有電話號碼，記得補上並可選顯示營業時間。

4. **幫助中心搜尋與熱門主題**  
   搜尋與熱門主題在 zh-TW 下已在地化；若之後有熱門文章點擊統計，可依數據調整排序或推薦。

5. **Dashboard 登入後完整流程**  
   建議以測試帳號實際走一遍：總覽 → 對話 → 聯絡人 → 知識庫 → 分析 → 自動化 → 行銷 → 設定（含 Bot 管理）→ 計費 → 系統測試，並檢查空狀態、錯誤訊息、權限與 RLS 行為。

6. **無障礙與鍵盤**  
   可再檢查：麵包屑 `aria-label`、表單 `label` 與錯誤訊息關聯、鍵盤 Tab 順序、焦點可見性（focus visible）。

7. **RWD 與效能**  
   首頁與幫助頁在手機與平板上的排版、字級與點擊區域可再實機確認；若幫助文章很長，可考慮錨點或目錄。

---

## 四、小結

- **已走訪**：首頁、登入、忘記密碼、幫助中心與分類／文章、支援、Demo/Docs 重導向。
- **已修正**：首頁「如何開始」語系、幫助文章內連結語系保留、文章頁麵包屑／時間／文末 feedback 與 metadata 之 i18n。
- **建議**：補齊「此文是否有幫助」的後端／分析、優化未登入時的 Loading 與導向、以測試帳號跑完 Dashboard 全流程，並視需求加強無障礙與 RWD。

若需要針對某一頁或某一功能（例如 Bot 管理、知識庫匯入）做更細的測試情境與案例，可以再指定範圍補寫。
