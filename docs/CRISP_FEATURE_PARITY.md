# Crisp 功能對照與實作路線圖

依據 [Crisp](https://crisp.chat/en/) 官網與定價頁整理，目標：**Crisp 有的功能，CustomerAIPro 也要有**。

---

## 一、Crisp 核心功能總覽

### 1. 官網主打的六大模組（One platform）

| Crisp 模組 | 說明 | CustomerAIPro 對應 | 狀態 |
|------------|------|--------------------|------|
| **AI Helpdesk** | 給團隊與客戶的 AI 超能力 | 設定頁 AI 模型、系統提示、知識庫驅動回覆 | ✅ 有（GPT + 知識庫） |
| **Chat widget** | 網站與 App 即時支援 | 設定頁「Chat Widget」嵌入碼、預覽 | ✅ 有（Widget 設定） |
| **Shared Inbox** | 集中所有進站訊息 | 對話紀錄列表 + 單一聯絡人對話 | ✅ 有（conversations） |
| **Knowledge Base** | 客戶自助、減少重複問題 | 知識庫 CRUD、分類、搜尋、測試 | ✅ 有 |
| **Support CRM** | 客戶資料與過往互動集中管理 | 聯絡人列表、標籤、生命週期、看板/分群 | ✅ 有（contacts 已強化） |
| **Support Analytics** | 監控團隊表現與對話指標 | 數據分析（總覽、趨勢、解決率） | ✅ 有（analytics） |

### 2. AI Agent 四步驟（Crisp 主推流程）

| 步驟 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| 1. Train your AI | 網站爬取、PDF、知識庫文章 | 知識庫手動/匯入；無自動爬站、無 PDF 解析 | 🟡 部分（缺：爬站、PDF） |
| 2. Create Workflow | No-code AI Agent 流程、範本庫 | 自動化工作流程（節點編輯器） | ✅ 有（automations） |
| 3. Test & Deploy | 多管道：Widget、WhatsApp、Messenger、Instagram、Email | LINE + Widget；無 WhatsApp/IG/Email | 🟡 部分（僅 LINE + Widget） |
| 4. Validate & Measure | 檢視 AI 對話、修正答案、迭代 | 對話紀錄、標籤、可手動介入；缺「AI 回答品質檢視」集中頁 | 🟡 部分（有 ai-quality 頁可加強） |

### 3. 管道與收件匣（Shared Inbox）

| 管道 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| Chat Widget | ✅ | ✅ 設定嵌入 | ✅ |
| Email | ✅ 共享信箱 | 設定「整合」Tab 有 Email（Coming soon） | ❌ 未做 |
| WhatsApp | ✅ | 僅 UI 佔位（整合與連接） | ❌ 未做 |
| Messenger / Instagram | ✅ | 僅 UI 佔位 | ❌ 未做 |
| LINE | Crisp Essentials 有 | ✅ Webhook + 回覆 | ✅ |
| 其他（SMS、Viber 等） | Crisp 有 | 無 | ❌ |

### 4. 知識庫（Knowledge Base）

| 功能 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| 文章撰寫與分類 | ✅ | ✅ | ✅ |
| 自訂 Help Center 對外 | ✅ 品牌化說明中心 | `/help` 有分類/文章；可再強化品牌 | 🟡 |
| 網站爬取 / 自動收錄 | ✅ | 無 | ❌ |
| PDF 匯入 | ✅ | 無（僅文字/CSV 匯入） | ❌ |
| 與對話整合 | ✅ 深整合 | 回覆時檢索知識庫 | ✅ |

### 5. 自動化與 Chatbot（Automations / AI Chatbot）

| 功能 | Crisp | CustomerAIPro | 狀態 |
| 說明 |
| No-code 流程編輯器 | ✅ 視覺化 + 條件/代理 | 有節點編輯器（automations） | ✅ |
| 情境範本庫 | ✅ | 無內建範本庫 | 🟡 可補 |
| 觸發：行為/關鍵字 | Chat triggers、行為觸發 | Webhook 依訊息觸發、關鍵字轉人工 | ✅ 部分 |
| 內部協作（私人備註） | Private notes | 對話可備註/標籤；無「僅內部可見」備註 | 🟡 |
| 捷徑（Shortcuts） | 預設訊息庫 | QuickReplies 設定 | ✅ |

### 6. CRM（Support CRM）

| 功能 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| 聯絡人集中列表 | ✅ | ✅ contacts | ✅ |
| 客戶資料欄位 | ✅ | 姓名、email、phone、標籤、來源、生命週期 | ✅ |
| 過往對話與互動 | ✅ | 依 contact 看對話、訊息 | ✅ |
| 分群/區隔 | ✅ | 標籤、看板（生命週期）、分群視圖 | ✅ |
| 與電商同步 | Shopify、WooCommerce 等 | 無 | ❌ |
| 客戶事件時間軸 | 常見於 CRM | 有 `customer_events`、API `/api/contacts/[id]/events` | ✅ |

### 7. 行銷與對外溝通（Campaigns）

| 功能 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| 推播 / 行銷訊息 | 郵件、in-app | Campaigns 頁（LINE 推播、分群） | 🟡 有頁與 API，待完整串接 LINE Broadcast |
| 分群發送 | ✅ | 依標籤/分群選對象 | 🟡 |

### 8. 分析（Analytics）

| 功能 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| 對話量 / 活動 | ✅ | 總覽、趨勢、解決率 | ✅ |
| 客服表現 | 客服指標 | 可擴充「客服負載」等 | 🟡 |
| 進階自訂報表 | Plus 方案 | 目前固定報表 | ❌ |

### 9. 定價與方案（Pricing）

| Crisp 方案 | 月費 | 重點 | CustomerAIPro |
|------------|------|------|----------------|
| Free | $0 | 2 seats、Widget、Shared Inbox、無 AI 額度 | 有 Free（對話/知識庫上限） |
| Mini | $45 | 4 seats、Email inbox、Shortcuts、Triggers、約 90 自動對話 | 可對應 Starter 檔次 |
| Essentials | $95 | 10 seats、Omnichannel、Workflow builder、Knowledge base、Analytics、Routing | 可對應 Pro 檔次 |
| Plus | $295 | 20+ seats、AI-First、Ticketing、100+ 整合、White label、Advanced analytics | 可對應 Business/Enterprise |

我們已有 `lib/plans.ts`（free/starter/pro/business），可對齊命名與上限。

### 10. 其他 Crisp 功能

| 功能 | Crisp | CustomerAIPro | 狀態 |
|------|--------|---------------|------|
| Ticketing 系統 | Plus 方案：客戶開單、追蹤 | 對話狀態（開啟/待處理/已解決） | 🟡 以對話狀態代替，可再產品化「工單」 |
| Status Page | 有 | 無 | ❌ |
| 白標（White labelling） | Plus | 無去品牌 | ❌ |
| 聯絡表單彙整到 Inbox | Contact form 整合 | 可經 API/Webhook 收表單 | 🟡 |
| 推播通知 | 新對話等 | 無 | ❌ |
| 自訂 Email 網域發信 | Mini+ | 無 | ❌ |
| 內建搜尋（訊息/文章/聯絡人） | ✅ | 全域搜尋 API + Cmd+K | ✅ |
| 行動 App | Crisp 有 | 無 | ❌ |
| Chat SDK | 有 | 無獨立 SDK 文件 | 🟡 |
| 100+ 整合（Zapier 等） | Plus | 設定有 Webhook/API Key 佔位 | 🟡 |

---

## 二、優先級建議（你要的 = Crisp 有我們也要）

### P0（已有，需維持品質）

- 對話紀錄（Shared Inbox 體驗）
- 聯絡人 CRM（列表、標籤、生命週期、看板/分群）
- 知識庫（CRUD、檢索、AI 回覆）
- 數據分析（總覽、趨勢、解決率）
- 自動化工作流程（節點編輯器）
- LINE + Widget 雙管道
- 方案與計費（方案上限、用量顯示）

### P1（高價值、對齊 Crisp）

1. **多管道收件匣**  
   - Email 收發進同一 Inbox（至少支援「收信 → 進對話」或綁定聯絡人）。  
   - 若資源有限，先做「聯絡我們表單 → 建立對話/聯絡人」也可視為第一階段。

2. **知識庫擴充**  
   - PDF 上傳並解析為知識庫條目。  
   - 選做：網站爬取（sitemap/URL 列表）自動產知識庫。

3. **AI 回答品質與迭代（Validate & Measure）**  
   - 已有 ai-quality 頁：可加強「標記錯誤回答 / 標記正確 / 納入知識庫」流程。  
   - 報表：AI 回答滿意度或標記統計。

4. **內部備註（Private notes）**  
   - 對話中可加「僅團隊可見」備註，不給客戶看。

5. **Campaigns 完整化**  
   - LINE Broadcast / 分群推播真正串接 LINE API；排程與成效欄位（送達率、讀取率）可先從現有 API 或假資料做起。

### P2（Crisp 有，我們可逐步補）

6. **Ticketing 產品化**  
   - 將「對話狀態」升級為工單：編號、優先級、指派、SLA（可先簡化）。

7. **路由與指派（Routing rules & Assignment）**  
   - 依規則自動分配對話給成員或標籤（需多 seat/角色支援）。

8. **自動化情境範本庫**  
   - 內建幾種常用流程範本（例如：FAQ、轉人工、收集資訊），一鍵複製到自己的 workflow。

9. **整合與連接**  
   - Webhook 文件化、API Key 發放與管理。  
   - Zapier/Make 範例或官方整合（若資源允許）。

10. **白標**  
    - 去「Powered by」、自訂 logo/色（依方案開放）。

### P3（中長期）

11. **Status Page**  
    - 服務狀態頁（維護、故障公告）。

12. **進階分析**  
    - 自訂維度、匯出、或簡單的儀表板編輯。

13. **WhatsApp / Messenger / Instagram**  
    - 依 Meta 與 Twilio 等 API 實作，成本與合規需單獨評估。

---

## 三、對照表速查

| Crisp 功能 | 我們有嗎 | 備註 |
|------------|----------|------|
| Chat Widget | ✅ | 設定嵌入 |
| Shared Inbox | ✅ | 對話紀錄 |
| Knowledge Base | ✅ | 缺 PDF/爬站 |
| Support CRM | ✅ | 聯絡人已強化 |
| Analytics | ✅ | 可再加客服/進階 |
| AI 回覆（知識庫 + GPT） | ✅ | 有 |
| Automations / Workflow | ✅ | 節點編輯器 |
| Campaigns | 🟡 | 有頁與 API，LINE 推播待完整 |
| LINE | ✅ | Webhook |
| Email 管道 | ❌ | 規劃中 |
| WhatsApp / IG / Messenger | ❌ | 未做 |
| Ticketing | 🟡 | 對話狀態可升級 |
| Private notes | ❌ | 可做 |
| PDF / 爬站 知識庫 | ❌ | 建議做 |
| AI 品質檢視與迭代 | 🟡 | ai-quality 可加強 |
| 方案分級與計費 | ✅ | plans.ts + billing |
| 白標 / Status Page / 進階分析 | ❌ | P2/P3 |

---

## 四、參考連結

- [Crisp 官網](https://crisp.chat/en/)
- [Crisp 定價](https://crisp.chat/en/pricing/)
- [Crisp 產品更新（Crisp 4）](https://crisp.chat/en/blog/crisp-4-product-update)（AI Data Hub、Writing tools、Internal copilot、Overlay search 等）

此文件可隨產品迭代更新「狀態」與優先級。
