# Sequential Thinking：多租戶 (Multi-tenant) 計費權限邏輯

> 本文件為「開始寫程式前」的拆解產物，用於釐清技術難點與步驟。實際開發時請以 `docs/memory-bank.md` 與 `docs/knowledge-graph-memory.md` 為架構依據。

---

## 1. 問題邊界

- **多租戶**：本專案已為「一 user 一租戶」（`users.id` = 租戶），無需引入 organization/workspace；「計費權限」指依方案 (plan) 限制用量與功能。
- **權限邏輯**：誰在什麼情境下可以執行什麼動作（例如：發送訊息、新增知識庫、看報表），以及超限時的處理。

---

## 2. 技術難點拆解

### 2.1 租戶與方案的對應

- **現狀**：`subscriptions` 表以 `user_id` + `plan_id` 表示訂閱；`lib/plans.ts` 以 slug（free/starter/pro/business）定義用量上限。
- **難點**：方案來源單一化——需決定「有效方案」只來自 `subscriptions`（status=active + current_period_end >= now）或是否保留 `users.plan` 作為 fallback。
- **決策建議**：以 `subscriptions` 為唯一真相來源；無有效訂閱時視為 `free`，並與 `lib/plans.ts` 的 PLAN_LIMITS 一致。

### 2.2 用量計算與計費週期

- **現狀**：`/api/billing/usage` 依訂閱的 `current_period_start/end` 計算當月對話數與知識庫筆數。
- **難點**：時區、週期邊界（月初/年末）、以及「當下請求」是否落在同一計費週期內需一致。
- **決策建議**：全系統統一用 UTC 儲存；計費週期由 `subscriptions.current_period_start/end` 定義，用量查詢嚴格落在該區間內。

### 2.3 權限檢查時機與層級

- **API 層**：每次會影響用量或受方案限制的 API（如 `/api/chat`、`/api/webhook/line`、`/api/knowledge-base` 的 POST）需在執行動作前檢查「當前租戶方案 + 當前用量」是否允許。
- **難點**：避免重複邏輯、競態（同一秒內多請求同時通過檢查）以及與 RLS 的分工——RLS 只管「誰能讀寫哪一列」，不管「是否超量」。
- **決策建議**：權限/用量檢查僅在應用層（API 或共用 service）實作；RLS 僅做「row 屬於該 user_id」的隔離，不包含 limit 邏輯。

### 2.4 超限行為

- **難點**：超限時是拒絕請求、降級回應、還是僅標記（事後計費/提醒）需事先定義。
- **決策建議**：對話數/知識庫數超限時 **拒絕** 並回傳 403 + 明確錯誤訊息；前端可依此引導升級方案。不採用「先執行再標記」以免爭議。

### 2.5 多租戶資料隔離（RLS）

- **現狀**：所有業務表皆以 `user_id`（或透過 `contact_id` → `contacts.user_id`）與 `auth.uid()` 綁定，RLS 已達成「租戶只能見自己的資料」。
- **難點**：新增表或欄位時必須一併設計 RLS policy，且需與既有 policy 風格一致（例如透過 contact 擁有權的 join）。
- **決策建議**：任何新表若與租戶相關，必須 `ENABLE ROW LEVEL SECURITY` 且 policy 使用 `auth.uid() = user_id` 或等價的 exists 子查詢；禁止開放「全表可讀」的 policy。

---

## 3. 實作步驟建議（不寫程式，僅順序）

1. **定義單一「有效方案」取得方式**：例如 `getEffectivePlan(userId)`，回傳 slug + period；無訂閱時回傳 free。
2. **集中用量檢查**：例如 `checkConversationLimit(userId)`、`checkKnowledgeLimit(userId)`，內部呼叫 `getEffectivePlan` 與現有用量查詢，回傳是否允許。
3. **在關鍵 API 掛鉤**：chat、webhook/line、knowledge-base 的寫入前呼叫上述檢查，失敗則 403。
4. **前端**：依 `/api/billing/usage` 或 403 錯誤碼顯示升級提示，不依前端自行計算是否超限。
5. **Migration 與 RLS**：若有新表，在 migration 內補齊 RLS；不變更既有表的 RLS 邏輯除非有明確需求。

---

## 4. 與 memory-bank / knowledge-graph-memory 的關係

- 上述 **核心架構決策**（方案單一來源、權限僅在應用層、超限即拒絕、RLS 僅做隔離）會寫入 `docs/memory-bank.md`。
- **Supabase 存取規則**與**依賴版本**會一併寫入，並標記為高優先級上下文，供後續多租戶/計費相關開發先讀取、不覆蓋既有架構。
