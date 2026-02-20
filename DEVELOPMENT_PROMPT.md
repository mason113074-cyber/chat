# Cursor AI 完整開發指令

請按照以下順序完成 CustomerAI Pro 的開發與優化。**所有路徑與檔案以專案現有結構為準**（如 `/api/webhook/line`、`/api/knowledge-base`、`app/[locale]/dashboard/`），勿從零建立已存在的 API。

---

## Phase 1: 前端優化 (2-3 小時)

### 任務 1.1: Landing Page 優化

請完成以下 Landing Page 優化（檔案：`app/[locale]/page.tsx` 及相關元件）：

1. Hero Section 下方加入客戶 Logo 區
   - 6 個 placeholder logos（使用 Tailwind 灰色方塊 + 公司名）
   - 水平滾動，響應式設計

2. 功能區後加入推薦語區
   - 3 張推薦卡片（頭像、姓名、職稱、公司、推薦文）
   - 使用 placeholder 數據

3. 定價區上方加入「為什麼選擇我們」
   - AI 準確率 95%、10 分鐘設定、24/7 回覆、資料加密

4. Footer 前加入安全保證區
   - 資料加密、個資保護、退款保證圖示

5. 更新 SEO meta tags
   - 每頁獨立 title/description（中英文，next-intl）
   - Open Graph + Twitter Card
   - JSON-LD 結構化數據

### 任務 1.2: Dashboard 空狀態設計

為以下 Dashboard 頁面設計空狀態（路徑：`app/[locale]/dashboard/`）：

1. Overview 頁面
   - 歡迎卡片 + 3 步驟引導：連接 LINE → 上傳知識庫 → 發送測試訊息
   - 可使用 Supabase 記錄進度（如 onboarding 狀態）

2. Knowledge Base 頁面
   - 「上傳你的第一份知識庫」
   - FAQ 範例模板下載按鈕
   - 支援拖拽上傳

3. Conversations 頁面
   - 「還沒有對話」+ LINE 連接引導
   - 「發送測試訊息」按鈕

4. Analytics 頁面
   - 模擬數據圖表（半透明 + overlay）或空狀態
   - 「連接 LINE 後即可查看真實數據」

請使用 Tailwind CSS，包含圖示（lucide-react）、標題、描述、CTA 按鈕。

### 任務 1.3: 定價頁面更新

更新定價頁（`app/[locale]/pricing/page.tsx` 與 `messages/*.json`）：

1. 方案定價已為：Starter NT$799、Pro NT$1,899、Business NT$5,299（1,000 / 5,000 / 20,000 次對話）。若有變動再改。
2. 首月優惠標籤：
   - Starter 首月 NT$599（原價刪除線）
   - Pro 首月 NT$1,399
   - 標註「早鳥優惠 · 第二個月起恢復原價」
3. UI 改進：
   - 推薦方案（Starter）加入 badge
   - 價格數字要大（如 48px）且醒目
   - 功能列表加入 checkmark icon
4. 同時更新中英文版本（next-intl）。

---

## Phase 2: 後端 API 完整性 (3-4 小時)

### 任務 2.1: 強化 /api/webhook/line

請檢查並強化 **`app/api/webhook/line/route.ts`**（與 `lib/line`）：

1. **Webhook 簽章驗證**
   - 已實作：使用 `validateSignature` 驗證 `X-Line-Signature`，錯誤回傳 401。維持或補強即可。

2. **訊息類型處理**
   - 目前僅處理 `message.type === 'text'`。請新增：
     - `image`：回覆「目前不支援圖片」
     - `sticker`：回覆表情符號或簡短說明
     - `location`：儲存並回覆確認（可寫入 conversations 或 contact 備註）

3. **錯誤處理**
   - try-catch 包覆所有邏輯
   - 錯誤可記錄到 Supabase（若有 `error_logs` 表）或現有日誌
   - 回傳 200 給 LINE 避免重試（重要）

4. **Rate Limiting**
   - 已存在（`checkRateLimit`）。維持「同一 userId 5 秒內只能發 1 則」或依現有設定；超過回覆「請稍等」。

請使用 TypeScript，完整型別定義。

### 任務 2.2: 優化現有 AI 回覆流程

優化 AI 回覆邏輯（**`lib/openai`**、**`lib/knowledge-search`**、**`app/api/webhook/line/route.ts`** 內 RAG 與 prompt）：

1. **RAG 知識庫檢索**
   - 已從 Supabase `knowledge_base` 透過 `searchKnowledgeWithSources` 查詢
   - 可調整：取前 3 筆最相關、chunk 長度或 embedding 相似度門檻

2. **Prompt 設計**
   - System Prompt 包含品牌身份、回覆風格（已部分在 `getUserSettings` 的 system_prompt）
   - 加入知識庫上下文（已有 KNOWLEDGE_PREFIX / KNOWLEDGE_EMPTY_INSTRUCTION）
   - 限制回覆長度（如 <200 字，目前 MAX_REPLY_LENGTH 可檢查）

3. **防幻覺機制**
   - 知識庫無相關內容時回覆「這個問題我需要請真人客服協助」（已有 KNOWLEDGE_EMPTY_INSTRUCTION）
   - 若有信心分數邏輯，<0.7 可自動轉人工

4. **對話歷史**
   - 從 Supabase conversations / messages 讀取最近 5 則，加入 prompt context（若尚未實作可補上）

請使用 zod 驗證輸入（若有對外 API），完整錯誤處理。

### 任務 2.3: 知識庫 API 完整性

使用既有路徑，確保功能完整：

- **GET/POST** ` /api/knowledge-base`（`app/api/knowledge-base/route.ts`）
- **POST** `/api/knowledge-base/import`（`app/api/knowledge-base/import/route.ts`）
- **GET/DELETE** `/api/knowledge-base/[id]`（`app/api/knowledge-base/[id]/route.ts`）

請確保：

1. 上傳/匯入支援 .txt、.pdf、.docx、.csv（若目前僅 JSON items，可擴充檔案上傳或說明文件）
2. 列表支援分頁（page, limit）— 若尚未有，可加上
3. 刪除時檢查權限（只能刪自己的），並清理快取（如 `clearKnowledgeCache`）
4. 使用 zod 驗證請求，所有操作符合 RLS

---

## Phase 3: 測試與部署 (2 小時)

### 任務 3.1: 完善 System Test / 健康檢查

1. **`/api/health-check`**（`app/api/health-check/route.ts`）已存在，Vercel Cron 已設定（`vercel.json` 每 15 分鐘）。
   - 確認檢查項目含：Supabase、OpenAI、LINE（若可行）、LemonSqueezy（若適用）
   - 失敗時使用現有 **`lib/alert-service`** 發送告警（如 Discord Webhook）

2. **可選**：
   - 將每次健康檢查結果寫入 Supabase（如 `system_tests` 表）
   - 建立 System Test Dashboard 頁面（如 `app/[locale]/dashboard/system-test/page.tsx`）顯示即時結果與最近 20 筆歷史

### 任務 3.2: 補強 E2E 測試

以現有 **Playwright** 與 **`e2e/full-flow-production.spec.ts`**、**`e2e/`** 結構為基礎：

- 註冊 → 登入 → 進入 Dashboard
- 連接 LINE Channel（設定頁）
- 上傳知識庫檔案或匯入
- 發送測試訊息並驗證回覆（若環境可測）
- 訂閱升級流程（若可測 LemonSqueezy test mode）

請使用既有 auth setup / fixtures，必要時建立 mock data。

---

## Phase 4: 效能優化 (1-2 小時)

### 任務 4.1: Core Web Vitals 優化

1. **圖片優化**
   - 所有 `<img>` 改用 `next/image`
   - 加入 width/height 避免 CLS
   - Hero 圖片加 priority 屬性

2. **字體優化**
   - 使用 `next/font` 載入字體（如 Inter）
   - font-display: swap

3. **Code Splitting**
   - Dashboard 使用 dynamic import  where 合適
   - Analytics 圖表延遲載入

4. **API 快取**
   - GET API 適當加入 revalidate 或 cache header
   - 可使用 Next.js unstable_cache  where 適用

目標：Lighthouse Score >90。

---

## 執行方式

1. 請逐個 Phase 執行，完成一個 Phase 後報告進度
2. 遇到錯誤請自動 debug 並修正
3. 所有代碼使用 TypeScript，啟用 strict mode
4. 完成後執行 `npm run check-all`（或 `npm run type-check && npm run lint && npm run build && npm run test:ui`）確保無錯誤
5. 單元測試：`npm run test:unit:run`；E2E：`npm run test:ui`
