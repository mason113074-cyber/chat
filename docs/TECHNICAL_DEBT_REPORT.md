# CustomerAIPro 技術債務處理總報告

**專案**：CustomerAIPro (mason113074-cyber/chat)  
**報告日期**：2026-02-18  
**範圍**：安全性、效能、可靠性三大面向之技術債務優化

---

## 一、摘要

本輪技術債務優化涵蓋 **LINE Webhook 安全性**、**OpenAI 呼叫可靠性與成本控管**、**快取策略**、**資料庫查詢效能**，以及 **設定與功能擴充**。所有項目均已完成並整合至主線，可於生產環境依環境變數與遷移腳本啟用。

---

## 二、LINE Webhook 安全性強化 ✅

### 2.1 實作檔案

| 檔案 | 說明 |
|------|------|
| `lib/idempotency.ts` | 冪等性檢查（防重複處理） |
| `lib/rate-limit.ts` | Rate Limiting（防濫用） |
| `app/api/webhook/line/route.ts` | 整合上述機制與日誌 |

### 2.2 核心功能

#### 冪等性檢查（Idempotency）

- **目的**：防止同一 LINE 事件被重複處理（例如網路重試、LINE 重送）。
- **實作**：
  - 使用 **Vercel KV（Upstash Redis）** 儲存事件 ID，TTL **1 小時**。
  - 開發環境無 KV 時使用 **記憶體 fallback**，避免本地開發需額外設定。
- **Event ID 優先順序**：
  1. `webhookEventId`（LINE 提供）
  2. `message.id`
  3. `replyToken`（fallback：`token:${replyToken}`）
  4. 最後 fallback：`ts:${timestamp}:${userId}`

#### Rate Limiting

- **目的**：限制單一使用者（LINE userId）的請求頻率，防止濫用與成本暴增。
- **規則**：**每使用者 20 次 / 60 秒**（固定 60 秒滑動視窗）。
- **實作**：
  - KV 儲存計數，無 KV 時使用記憶體。
  - KV 失敗時 **允許請求通過**（fail-open），避免單點故障導致服務中斷。
- **超限行為**：回覆「您發送訊息的頻率過高，請稍後再試。」，**不返回 HTTP 429**，避免 LINE 平台重試造成重複處理。

#### 日誌追蹤

- **Request ID**：每次 webhook 請求產生唯一 `requestId`（`line-${timestamp}-${random}`），便於串起同一次請求的所有日誌。
- **記錄內容**：
  - 請求進入：event 數量、eventIds（前 5 個）、destination。
  - 成功：處理耗時 `durationMs`。
  - 重複事件：`Duplicate event skipped` + `eventId`。
  - Rate limit 超限：`Rate limit exceeded` + `remaining`、`resetAt`。
  - 錯誤：`Event error` + `eventId`、錯誤訊息（不記錄完整訊息內容以兼顧隱私）。

### 2.3 環境變數

```bash
# Vercel KV（Upstash Redis）- 生產環境建議設定
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx
```

未設定時，冪等與 rate limit 皆使用記憶體 fallback，適合單機／開發；多實例部署請務必設定 KV。

---

## 三、OpenAI 呼叫可靠性與成本控管 ✅

### 3.1 實作檔案

| 檔案 | 說明 |
|------|------|
| `lib/openai.ts` | 主流程：timeout、重試、預算檢查、用量寫入、錯誤 fallback |
| `lib/openai-error-handler.ts` | 錯誤分類與使用者可見 fallback 訊息 |
| `lib/openai-usage.ts` | 成本計算、用量寫入、月預算檢查 |
| `lib/retry.ts` | 通用指數退避重試 |

### 3.2 錯誤處理與重試

- **錯誤分類**（`classifyOpenAIError`）：
  - `rate_limit`（429）、`timeout`、`server_error`（5xx）→ **可重試**。
  - `auth`（401/403、invalid_api_key、insufficient_quota）、`context_length`（400）→ **不可重試**。
- **使用者 fallback 訊息**（`getFallbackMessage`）：依錯誤類型回傳繁體中文友善訊息（如「目前使用量較大，請稍後再試。」、「回覆生成逾時，請再試一次。」），避免將原始 API 錯誤暴露給終端用戶。
- **重試**：使用 `retryWithBackoff`，重試次數由 `OPENAI_MAX_RETRIES` 控制（預設 2），僅對「可重試」錯誤重試；OpenAI 客戶端 `maxRetries: 0`，由自訂邏輯統一控制。

### 3.3 Timeout 與預算

- **Timeout**：`OPENAI_TIMEOUT_MS`（預設 30000 ms），避免單一請求掛住過久。
- **月預算**：`OPENAI_MONTHLY_BUDGET`（美金/月，預設 100）。`generateReply` 若傳入 `userId`（例如 LINE webhook 傳入 owner userId），會先 `checkTokenBudget`；超出時直接回傳「本月 AI 回覆額度已達上限，請聯繫客服或升級方案。」，不呼叫 API。

### 3.4 用量追蹤

- **表**：`public.openai_usage`（migration `012_create_openai_usage.sql`）。
- **欄位**：`user_id`（FK auth.users）、`prompt_tokens`、`completion_tokens`、`total_tokens`、`cost_usd`、`created_at`。
- **索引**：`idx_openai_usage_user_date`、`idx_openai_usage_created_at`；RLS 僅允許使用者查詢自己的資料。
- **成本計算**：依模型單價（目前實作 gpt-4o-mini）計算每次呼叫成本並寫入；預算檢查以當月 `cost_usd` 加總為準。

### 3.5 環境變數

```bash
OPENAI_API_KEY=          # 必填
OPENAI_TIMEOUT_MS=30000  # 選填，毫秒
OPENAI_MAX_RETRIES=2     # 選填，重試次數
OPENAI_MONTHLY_BUDGET=100 # 選填，美金/月
```

---

## 四、快取策略 ✅

### 4.1 通用快取層 `lib/cache.ts`

- **介面**：`getCached`、`setCached`、`deleteCached`、`deleteCachedPattern`。
- **儲存**：**記憶體 + Vercel KV**（雙層）；KV 未設定時僅用記憶體，build/本地無需 KV。
- **TTL**：以秒為單位，可依呼叫端指定；預設 300 秒。
- **Pattern 刪除**：KV 使用 `keys(pattern)` + `del`；記憶體以 glob 轉 regex 比對 key，定期 `cleanupMemoryCache`（每 5 分鐘）清理過期項目。

### 4.2 使用者設定快取

- **位置**：`lib/supabase.ts` — `getUserSettings(userId)`。
- **邏輯**：以 `user_settings:${userId}` 為 key，TTL **10 分鐘**；內容含 `system_prompt`、`ai_model`、`store_name`（以及後續擴充欄位）。
- **失效**：`invalidateUserSettingsCache(userId)` = `deleteCached('user_settings:' + userId)`，於 **設定 API POST 成功更新後** 呼叫。

### 4.3 知識庫搜尋快取

- **位置**：`lib/knowledge-search.ts` — `searchKnowledgeWithSources`。
- **Key**：`knowledge_search:${userId}:${queryHash}`，queryHash 為 `userId:message:limit:maxChars` 的 MD5 前 12 字元；TTL **5 分鐘**。
- **失效**：`clearKnowledgeCache(userId)` = `deleteCachedPattern('knowledge_search:' + userId + ':*')`，於知識庫 **新增 / 更新 / 刪除 / 匯入** API 成功後呼叫。

### 4.4 Analytics 快取

- **位置**：`lib/analytics-cache.ts`。
- **介面**：`getAnalyticsCached(userId, dateRange)`、`invalidateAnalyticsCache(userId)`。
- **Key**：`analytics:${userId}:${dateRange.start}:${dateRange.end}`，TTL **10 分鐘**。
- **資料來源**：conversations 無 `user_id`，經由 `contacts` 取得該使用者的 `contact_ids`，再查詢 `conversations` 並彙總 `totalConversations`、`aiHandled`、`needsHuman`、`autoResolveRate`；`avgResponseTime`、`topIssues` 保留為 TODO。
- **失效**：於 **LINE webhook 成功寫入新對話後** 呼叫 `invalidateAnalyticsCache(ownerUserId)`（fire-and-forget），確保儀表板在下次讀取時可取得新資料或重新計算。

---

## 五、資料庫查詢效能 ✅

### 5.1 OpenAI 用量表（Migration 012）

- `public.openai_usage` 建立、索引與 RLS 如上節所述。

### 5.2 索引優化（Migration 013）

- **conversations**：  
  `idx_conversations_contact_created`、`idx_conversations_contact_status`、`idx_conversations_contact_created_status`，支援依 contact 與時間／狀態之查詢與 Analytics。
- **contacts**：  
  `idx_contacts_user_created`、`idx_contacts_user_status`（註：contacts 有 status，用於 pending/resolved）。
- **knowledge_base**：  
  `idx_knowledge_user_created`；既有 `idx_knowledge_base_user_active` 未重複建立。
- **contact_tags / contact_tag_assignments**：  
  `idx_contact_tags_user_id`、`idx_contact_tag_assignments_contact_id`、`idx_contact_tag_assignments_tag_id`。

專案中訊息存於 `conversations` 表，無獨立 `conversation_messages` 表；依 user 篩選需先查 `contacts(user_id)` 再以 `contact_id` 查 conversations，上述索引支援此路徑。

---

## 六、設定與功能擴充（與技術債務相關部分）

- **快捷回覆（Quick Replies）**：`users.quick_replies`（JSONB）、設定 API 與 dashboard 編輯、Widget 預覽；不影響本報告之安全／效能／可靠性主軸，僅列為功能擴充。
- **設定頁 UI**：AI 模型選項與「AI 回覆風格」按鈕之對比與選取狀態樣式修正（如 `has-[:checked]:bg-indigo-50`、`text-indigo-900`），提升可讀性與無障礙。

---

## 七、環境變數總覽

| 變數 | 用途 | 必填 |
|------|------|------|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 冪等、Rate limit、各類快取（生產建議） | 否（有記憶體 fallback） |
| `OPENAI_API_KEY` | OpenAI 呼叫 | 是 |
| `OPENAI_TIMEOUT_MS` | 單次請求逾時（ms） | 否（預設 30000） |
| `OPENAI_MAX_RETRIES` | 可重試錯誤之重試次數 | 否（預設 2） |
| `OPENAI_MONTHLY_BUDGET` | 每使用者月預算（美金） | 否（預設 100） |
| 其餘既有變數（Supabase、LINE、NEXT_PUBLIC_*） | 依既有文件 | 依既有規定 |

---

## 八、建議後續項目（未實作）

- **avgResponseTime / topIssues**：在 `getAnalyticsCached` 中實作平均回應時間（user→assistant 成對時間差）與常見問題彙總。
- **Analytics API 統一**：可考慮讓 `app/api/analytics/overview` 或 `resolution` 改為使用 `getAnalyticsCached`，以單一快取來源簡化維護。
- **gpt-4o / gpt-3.5-turbo 定價**：在 `openai-usage.ts` 的 `MODEL_PRICING` 中補上其他模型單價，以正確計算成本與預算。

---

## 九、結論

本輪技術債務處理已完成 **LINE Webhook 安全性**（冪等、Rate limit、日誌）、**OpenAI 可靠性與成本控管**（錯誤分類、重試、timeout、月預算、用量表）、**多層快取與失效策略**（設定、知識庫、Analytics）、以及 **資料庫索引優化**。系統在安全性、效能與可維護性上均有明顯提升，可依本報告與 `.env.example`、migrations 於生產環境驗收與上線。
