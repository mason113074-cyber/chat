# CustomerAIPro 全站優化掃描報告

掃描時間：2025-02（Task #4 完成後）

---

## ✅ 已優化頁面（無需再動）

| 頁面 | 狀態 |
|------|------|
| **Landing** | Task #1：動態統計、Beta banner、NT$ 定價、i18n |
| **Settings** | Task #2：LINE 區塊、i18n、移除「即將推出」 |
| **Billing** | Task #3：全頁 i18n、聯繫客服取代「即將推出」 |
| **Conversations 列表** | Task #4：元件化、全頁 i18n |
| **Dashboard 首頁** | 已使用 `getTranslations('dashboard')`，資料來自 Supabase（非假資料） |

---

## ⚠️ 待優化頁面（硬編碼 / 缺 i18n）

### 1. Conversations 詳情頁 `/[locale]/dashboard/conversations/[contactId]`
- **硬編碼**：載入中、找不到此對話、返回、未命名客戶、標籤、AI 自動/手動、新增標籤、對話狀態、按鈕文案（標記已解決/需人工/關閉/重新開啟）、尚無對話內容
- **建議**：新增 `conversations.detail` 或單獨 namespace，與列表共用部分 key

### 2. Contacts 客戶管理 `/[locale]/dashboard/contacts`
- **硬編碼**：載入中、載入失敗、重新載入、客戶管理、共 N 位聯絡人、管理標籤、標籤篩選、清除篩選、還沒有客戶、表頭（名稱/標籤/對話數量/最後互動）、未命名客戶、新增標籤、上一頁/下一頁、分頁文案、管理標籤 modal（儲存/取消/編輯/刪除）
- **資料**：來自 API，非假資料
- **建議**：Task #8，全頁 i18n；若結構龐大可考慮像 Conversations 做元件拆分

### 3. Analytics 數據分析 `/[locale]/dashboard/analytics`
- **硬編碼**：尚無數據、載入中、載入失敗、重新載入、數據分析、最近 N 天、表頭與指標（本月對話總量、AI 回覆數、平均回覆速度、新客戶數、AI 自動解決率）、需要關注的問題、客戶名稱/問題內容/時間/狀態、熱門問題 Top 10、排名/關鍵字/次數/佔比、客戶活躍度、AI 回覆品質概覽等
- **建議**：Task #7，全頁 i18n（key 較多，可一次做完）

### 4. Knowledge Base 知識庫 `/[locale]/dashboard/knowledge-base`
- **硬編碼**：分類選項（其他、常見問題、產品資訊、退換貨政策、營業資訊）、分類 badge 為中文、toast「已更新」「已新增」
- **建議**：Task #6，分類與 UI 文案改走 i18n

### 5. Onboarding 引導 `/[locale]/dashboard/onboarding`
- **硬編碼**：步驟標題、產業類型選項、語氣選項、AI 模型描述、表單標籤、錯誤訊息（請填寫商店名稱、儲存失敗等）、按鈕與說明文案
- **建議**：獨立 Task，全頁 i18n（與登入後主流程一致）

### 6. Conversations 列表頁殘留（可選）
- 少數文案仍硬編碼：`未命名`（fallback）、`操作失敗`/`完成`、`confirm('確定要刪除...')`、`window.prompt('請輸入要新增的標籤名稱')`、`尚無對話`
- **建議**：補進 `conversations` 的 key 即可，改動小

---

## 建議優先順序

| 優先 | 頁面 | 理由 |
|------|------|------|
| 1 | **Conversations [contactId]** | 與已優化的列表頁連動，補齊體驗 |
| 2 | **Contacts** | 高頻使用，i18n 後全站語系一致 |
| 3 | **Analytics** | 數據頁 key 多，一次做完效益高 |
| 4 | **Knowledge Base** | 改動集中，容易完成 |
| 5 | **Onboarding** | 新用戶第一印象，有餘力再做 |
| - | **Conversations 殘留** | 小補丁，可併入 Task #4 或單獨小 commit |

---

## 下一步可選

- **選項 A**：從上表依序做 Task #5–#8（Dashboard 首頁已 OK，可從 Conversations 詳情或 Contacts 開始）
- **選項 B**：先做功能開發（付款、LINE、AI 品質、SEO），稍後再補 i18n
- **選項 C**：先 E2E / 部署驗證，再排優化與功能

此報告可作為 Product 或 Sprint 排程依據。
