# CustomerAI Pro — 網站使用手冊（完整 Playbook）

**版本**：1.0  
**適用**：https://www.customeraipro.com 與本地開發環境  
**語言**：繁體中文（介面支援 zh-TW / en）

---

## 一、產品簡介

CustomerAI Pro 是 **AI 智能客服 SaaS 平台**，主要功能包括：

- **LINE 客服自動化**：串接 LINE Messaging API，客戶傳訊息到您的官方帳號後，由 AI 依知識庫與規則回覆。
- **知識庫管理**：上傳 FAQ、退換貨政策、營業資訊等，供 AI 檢索並生成回答。
- **對話與聯絡人**：集中檢視所有對話紀錄、聯絡人與標籤。
- **數據分析**：對話趨勢、AI 解決率、熱門問題等報表。
- **自動化工作流程**：視覺化流程設計（Automations），依條件觸發回覆或轉人工。
- **行銷活動**：LINE 推播與分群（Campaigns）。
- **多 Bot 管理**：一個帳號可綁定多個 LINE Bot，適合多品牌／多頻道。

**方案與限制**（依 `lib/plans.ts`）：

| 方案     | 每月對話數 | 知識庫條目 |
|----------|------------|------------|
| Free     | 100        | 50         |
| Starter  | 1,000      | 200        |
| Pro      | 5,000      | 1,000      |
| Business | 20,000     | 5,000      |

---

## 二、註冊與登入

### 2.1 網址與語系

- **正式站**：https://www.customeraipro.com  
- **語系**：網址前綴為 `/zh-TW` 或 `/en`，例如：  
  - https://www.customeraipro.com/zh-TW/login  
  - https://www.customeraipro.com/en/dashboard  

### 2.2 登入方式

1. 前往 **/login**（或首頁點「登入」）。
2. 輸入 **Email** 與 **密碼**，點「登入」。
3. 成功後導向 **/dashboard**（總覽頁）。

### 2.3 首次使用（Onboarding）

- 首次登入可經由 **/dashboard/onboarding** 引導：
  - 歡迎與產品介紹
  - LINE 設定教學（Channel Secret、Token、Webhook URL）
  - 知識庫建議（上傳第一筆 FAQ）
  - 測試對話建議
- 可隨時從側邊欄或設定頁進入各功能，不強制完成 Onboarding。

---

## 三、儀表板總覽（Dashboard）

路徑：**/dashboard**（或 `/zh-TW/dashboard`、`/en/dashboard`）

### 3.1 側邊欄導航（主選單）

| 項目       | 路徑                         | 說明                     |
|------------|------------------------------|--------------------------|
| 總覽       | /dashboard                   | 本日／本週數據與最近對話 |
| 對話紀錄   | /dashboard/conversations     | 所有對話列表，可點入單一聯絡人 |
| 客戶聯絡人 | /dashboard/contacts          | 聯絡人列表、標籤、詳情   |
| 知識庫     | /dashboard/knowledge-base    | 知識條目新增／編輯／分類 |
| 數據分析   | /dashboard/analytics         | 趨勢、解決率、熱門問題   |
| 自動化     | /dashboard/automations       | 工作流程設計與執行       |
| 行銷活動   | /dashboard/campaigns         | LINE 推播與活動          |
| 設定       | /dashboard/settings         | AI、LINE、整合、Bot 管理 |

**底部選單**：

| 項目       | 路徑                   | 說明           |
|------------|------------------------|----------------|
| 方案與計費 | /dashboard/billing     | 方案、用量、升級 |
| 系統測試   | /dashboard/system-test | 健康檢查、API 測試 |

### 3.2 總覽頁內容

- 本日／本週聯絡人數、對話數
- 近期對話趨勢圖
- 最近幾筆對話預覽（可點入該聯絡人對話頁）
- 快捷連結：前往設定、知識庫等

### 3.3 全域功能

- **搜尋**：Ctrl+K（或 Cmd+K）開啟全域搜尋，可搜頁面、設定、說明等。
- **使用量提示**：若接近方案上限，頂部可能顯示用量警告。

---

## 四、對話紀錄（Conversations）

路徑：**/dashboard/conversations**

### 4.1 功能說明

- 列出所有「聯絡人維度的對話」（一個聯絡人一條對話串）。
- 側邊或列表可顯示：聯絡人名稱、最後訊息時間、狀態（如需人工處理會標示）。
- 點選某一聯絡人進入 **/dashboard/conversations/[contactId]**。

### 4.2 單一對話頁（聯絡人對話詳情）

- **左側**：該聯絡人與 AI／客服的完整對話紀錄。
- **右側（或下方）**：
  - **AI 建議稿（Suggestions）**：當 AI 判定為 SUGGEST 時，會產生草稿，顯示「建議回覆」與「一鍵送出」。
  - 送出後狀態會更新為已送出，且具防雙發（同一則建議不重複送）。
- **操作**：可手動輸入回覆、或採用 AI 建議稿並一鍵送出。

### 4.3 狀態說明

- **needs_human**：需人工介入（高風險、或 ASK/HANDOFF 等），側邊欄可能顯示待處理數量。
- **resolved**：對話已解決（由 AI 或人工標記）。

---

## 五、客戶聯絡人（Contacts）

路徑：**/dashboard/contacts**

### 5.1 功能說明

- 聯絡人列表：來自 LINE（或其他整合）的客戶。
- 可檢視：名稱、LINE 資訊、對話數、最後互動時間、標籤等。
- 支援篩選、分頁、標籤管理。

### 5.2 聯絡人詳情

- 點進單一聯絡人可看詳細資料、對話紀錄（通常會連到該聯絡人的對話頁）。
- 可編輯備註、標籤、CSAT 等（依實作欄位為準）。

---

## 六、知識庫（Knowledge Base）

路徑：**/dashboard/knowledge-base**

### 6.1 用途

- 供 AI 檢索（RAG）：客戶問題會先做關鍵字／語意檢索，再依命中內容生成回覆。
- 條目包含：標題、內容、分類（如常見問題、退換貨、營業資訊等）。

### 6.2 基本操作

- **新增**：點「新增」或「新增知識」，填寫標題、分類、內容後儲存。
- **編輯／刪除**：在列表或詳情中編輯、刪除。
- **匯入**：支援從 URL 或文字匯入多筆（依介面提供之匯入功能）。
- **分類**：建議使用一致的分類（如常見問題、產品資訊、退換貨政策、營業資訊），方便報表與檢索。

### 6.3 與 AI 回覆的關係

- 知識庫命中數（sourcesCount）會影響 AI 決策：有命中且信心夠高才可能 **AUTO** 直接回覆；否則易為 **SUGGEST**（出草稿）或 **ASK**／**HANDOFF**。
- 中文問題會經 CJK tokenizer 與同義詞正規化（如退錢→退款）以提升命中率。

---

## 七、數據分析（Analytics）

路徑：**/dashboard/analytics**

### 7.1 常見內容

- **總覽**：對話量、AI 解決率、需人工比例等。
- **趨勢**：依日／週的對話或解決率趨勢。
- **熱門問題／主題**：常被問到的內容，可作為知識庫擴充參考。
- **解析度／品質**：AI 回覆品質或解決率相關指標（依實作）。

### 7.2 使用建議

- 定期查看「熱門問題」，將尚未收錄的題目補進知識庫。
- 觀察「需人工」比例，調整知識庫或 Guardrail 關鍵字。

---

## 八、自動化（Automations）

路徑：**/dashboard/automations**

### 8.1 功能說明

- **工作流程（Workflow）**：以節點與連線設計流程（例如：收到訊息 → 條件判斷 → 回覆或轉人工）。
- **節點類型**：通常包含觸發、條件、動作（如回覆訊息）、路由等。
- 多 Bot 情境下，流程會依 **該 Bot 的憑證** 回覆（WorkflowEngine 已支援傳入 credentials）。

### 8.2 基本操作

- **新增工作流程**：建立新流程、命名、拖曳節點與連線。
- **編輯**：點進某一流程進行編輯、儲存。
- **啟用／停用**：依介面開關控制是否執行。

---

## 九、行銷活動（Campaigns）

路徑：**/dashboard/campaigns**

### 9.1 功能說明

- LINE 推播、分群發送等（依實作）。
- 列表可看活動名稱、狀態、目標、送達率等。
- **新增活動**：/dashboard/campaigns/new。

### 9.2 基本操作

- 建立活動 → 設定名稱、目標受眾、內容、排程 → 發送或排程。

---

## 十、設定（Settings）

路徑：**/dashboard/settings**

設定頁以 **分頁（Tab）** 切換，可透過 **URL hash** 直達，例如：  
`/dashboard/settings#integrations`

### 10.1 分頁一覽

| 分頁       | Hash           | 說明                     |
|------------|-----------------|--------------------------|
| 基本設定   | #general        | 商店名稱、AI 模型、回覆長度等 |
| AI 人格    | #personality    | System Prompt、快捷回覆、語氣 |
| 行為規則   | #behavior       | 敏感詞、Guardrail、低信心處理 |
| 對話體驗   | #experience     | 延遲、打字指示等         |
| 測試優化   | #optimize       | 測試與預覽               |
| 整合與連接 | #integrations   | LINE、Bot 管理、Webhook 等 |

### 10.2 整合與連接（#integrations）

- **Bot 管理**：  
  - 頁面內有「Bot 管理」按鈕，或點「LINE Messaging API」卡片的「Settings」，進入 **/dashboard/settings/bots**。
- **Webhook 設定**：  
  - 顯示目前 Webhook URL（單一 Bot 情境可能在此顯示；多 Bot 時以 Bot 管理頁為準）。

### 10.3 Bot 管理（LINE Bot 管理）

路徑：**/dashboard/settings/bots**

- **列表**：  
  - 顯示已連接的 LINE Bot（名稱、狀態、Webhook URL、建立時間）。  
  - Webhook URL 格式：`https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}`（實際 key 僅在新增時顯示一次，列表以遮罩顯示）。
- **新增 Bot**：  
  - 點「新增 LINE Bot」→ 填寫 Bot 名稱、Channel Secret、Channel Access Token，可選填自訂 Webhook Key。  
  - 可先「測試連線」再「儲存」；儲存後請將產生的 Webhook URL 填回 LINE Developers Console 的 Webhook 設定。
- **編輯**：  
  - 可修改名稱；若勾選「重新輸入 Channel Secret 和 Token」可更新憑證；可「重新產生 Webhook Key」。
- **刪除**：  
  - 刪除後該 Bot 不再收發訊息，既有對話紀錄保留。
- **測試連線**：  
  - 列表或表單內可對單一 Bot 或一組憑證做連線測試（呼叫 LINE API 取得 Bot 資訊）。

### 10.4 LINE 單一 Bot（舊版／相容）

- 若仍使用「單一 LINE 頻道」、在設定頁的 **LINE 整合** 區塊填寫 Channel ID / Secret / Token，則 Webhook 可能為：  
  `https://www.customeraipro.com/api/webhook/line`  
- 多 Bot 架構下，以 **Bot 管理** 為準，每個 Bot 有獨立 Webhook 路徑與憑證。

### 10.5 敏感詞與 Guardrail

- 在 **行為規則** 等分頁可設定「敏感詞」與觸發時的固定回覆。
- 當客戶訊息觸發敏感詞（如退款、賠償等），AI 會改回傳安全話術（如建議聯繫人工），且**不會產生 SUGGEST 草稿**，因此對話列表不會出現該則建議稿。

---

## 十一、方案與計費（Billing）

路徑：**/dashboard/billing**

- 目前方案、每月對話用量、知識庫條目數。
- 升級／變更方案（依是否有串接金流而不同）。
- 用量超過方案上限時，可能限制新對話或新知識條目，需升級或等待下個計費週期。

---

## 十二、系統測試（System Test）

路徑：**/dashboard/system-test**

- 健康檢查：API、資料庫、外部服務（OpenAI、LINE 等）、安全機制、i18n 等。
- 用於自我診斷或提供給支援人員參考。

---

## 十三、AI 副駕流程（決策層）

後台依 **AI Copilot 決策** 決定每則客戶訊息要如何處理，規則見 **docs/AI_COPILOT_POLICY.md**。

### 13.1 四種結果

| 結果      | 說明                     | 使用者看到／操作                         |
|-----------|--------------------------|------------------------------------------|
| **AUTO** | 低風險、有知識庫命中、信心夠 | AI 直接回覆，無需操作                    |
| **SUGGEST** | 高風險或信心不足       | 產生「建議回覆」草稿，需人工一鍵送出或修改 |
| **ASK**  | 缺必要資訊               | AI 先問問題（如訂單編號），不硬答        |
| **HANDOFF** | 需轉人工               | 固定轉人工話術，對話標為需人工處理       |

### 13.2 敏感詞（Guardrail）

- 觸發敏感詞時，以安全回覆為主，**不進入一般 SUGGEST 流程**，故不會出現該則建議稿。
- 若希望某類問題仍出草稿，可調整 Guardrail 關鍵字或邏輯（需開發／設定變更）。

### 13.3 建議稿操作（SUGGEST）

1. 在 **對話紀錄** 點進該聯絡人對話頁。
2. 右側或下方會顯示「AI 建議回覆」。
3. 可編輯後再送，或直接「一鍵送出」。
4. 送出後狀態為已送出，同一則不會重複送出（防雙發）。

---

## 十四、LINE 端設定（Webhook）

### 14.1 多 Bot 架構（建議）

1. 在 **LINE Developers Console** 建立頻道（或使用既有頻道）。
2. 取得 **Channel Secret**、**Channel Access Token**（長期 Token）。
3. 在 CustomerAI Pro **Bot 管理** 新增 Bot，貼上 Secret 與 Token，取得 **Webhook URL**。
4. 在 LINE 後台 **Messaging API** 設定：
   - **Webhook URL**：貼上步驟 3 的 URL。
   - **Use webhook**：開啟。

### 14.2 Webhook URL 格式

- 多 Bot：`https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}`
- 單一 Bot（舊）：可能為 `https://www.customeraipro.com/api/webhook/line`（依實際設定）

### 14.3 驗證

- 在 Bot 管理頁對該 Bot 點「測試連線」，成功即表示憑證與 LINE API 正常。
- 從 LINE 傳一則測試訊息，到 **對話紀錄** 確認是否有新對話與 AI 回覆或建議稿。

---

## 十五、常見流程速查

### 15.1 從零到第一則 AI 回覆

1. 註冊／登入 → 進入 Dashboard。
2. **設定 LINE Bot**：  
   設定 → 整合與連接 → Bot 管理 → 新增 LINE Bot → 填 Secret / Token → 儲存 → 複製 Webhook URL → 到 LINE 後台貼上並開啟 Webhook。
3. **知識庫**：  
   至少新增幾筆 FAQ（標題、內容、分類）。
4. **（可選）** 調整 **設定** 的 AI 人格、回覆長度、敏感詞等。
5. 用手機 LINE 對該官方帳號傳訊息 → 回 Dashboard **對話紀錄** 檢查是否有新對話與 AI 回覆或建議稿。

### 15.2 想讓「退錢／退款」類問題出現建議稿

- 確認知識庫有相關條目（例如退換貨流程）。
- 若目前被 Guardrail 攔截，會只回安全話術且不出草稿；要出草稿需調整 Guardrail 或改用非敏感詞的測試句（如「營業時間」）驗證 SUGGEST 流程。

### 15.3 多個 LINE 官方帳號（多 Bot）

- 在 **Bot 管理** 多次「新增 LINE Bot」，每個填不同 Secret / Token。
- 每個 Bot 會得到一組 Webhook URL，分別填回對應的 LINE 頻道。
- 對話與聯絡人會依 Bot 區分，後台可依對話／聯絡人所屬 Bot 檢視。

---

## 十六、快捷鍵與介面技巧

- **Ctrl+K（Cmd+K）**：開啟全域搜尋。
- **側邊欄**：可收合／展開，節省空間。
- **設定分頁**：網址加 `#integrations`、`#general` 等可直達該分頁。
- **Bot 管理**：從 設定 → 整合與連接 → 點「Bot 管理」或 LINE 卡片的「Settings」。

---

## 十七、疑難排解與幫助資源

### 17.1 常見問題

- **收不到 LINE 訊息**：檢查 Webhook URL 是否正確、Use webhook 是否開啟、Bot 管理內該 Bot 狀態是否啟用。
- **沒有 AI 建議稿**：可能是 AUTO 直接回覆、或 ASK/HANDOFF、或觸發 Guardrail；可先用簡單問句（如營業時間）與知識庫條目測試。
- **sourcesCount 為 0**：知識庫未命中，可補知識庫或調整問法；中文會經 CJK tokenizer 與同義詞正規化。

### 17.2 幫助中心

- 站內 **Help**（/help 或 /zh-TW/help）：分類與多篇說明文章。
- **系統測試** 頁：檢查 API、DB、外部服務狀態。
- 技術文件：**docs/** 目錄（如 AI_COPILOT_POLICY.md、REPO_STATUS_REPORT.md、MIGRATION_DECISION.md）。

---

## 十八、文件與路徑速查表

| 項目         | 路徑或說明 |
|--------------|------------|
| 登入         | /login     |
| 總覽         | /dashboard |
| 對話紀錄     | /dashboard/conversations |
| 單一對話     | /dashboard/conversations/[contactId] |
| 聯絡人       | /dashboard/contacts |
| 知識庫       | /dashboard/knowledge-base |
| 數據分析     | /dashboard/analytics |
| 自動化       | /dashboard/automations |
| 行銷活動     | /dashboard/campaigns |
| 設定         | /dashboard/settings |
| 設定-整合    | /dashboard/settings#integrations |
| Bot 管理     | /dashboard/settings/bots |
| 方案計費     | /dashboard/billing |
| 系統測試     | /dashboard/system-test |
| Onboarding   | /dashboard/onboarding |
| 幫助中心     | /help、/zh-TW/help、/en/help |

---

*本手冊依目前程式與 docs 撰寫，若功能有異動請以實際介面與官方公告為準。*
