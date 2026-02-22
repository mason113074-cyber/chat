# Production 冒煙測試 Runbook（PR #14 上線後 — 讓 ai_suggestions 一定會出現）

**目標**：在 production（customeraipro.com / www.customeraipro.com）或已綁定 LINE 環境，照步驟執行後可驗收 AI 副駕並讓 `ai_suggestions` 有資料可觀測。  
**前置**：LINE webhook 已指到正確網址、至少一個 bot 或 LINE_OWNER_USER_ID 已設；環境變數僅列名稱不洩漏值。

---

## 測試步驟（照做即可）

### D1) LINE 發一般問題（低風險）→ 應回覆 → conversations 有 assistant

1. 用已綁定該站的 LINE 帳號，發一則**知識庫有涵蓋**的一般問題（例如：營業時間、退換貨流程）。
2. **預期**：LINE 收到 AI 回覆；後台 **Dashboard → 對話** 點進該聯絡人，對話紀錄中出現 **assistant** 訊息，且該則狀態為 ai_handled（或等同）。
3. **觀測**：Supabase → `conversations` 表，該 contact_id 最新一筆 role=assistant、resolved_by=ai（或等同欄位）。

---

### D2) LINE 發高風險關鍵字 → 必須產生 ai_suggestions draft → LINE 固定 handoff/ack

1. 用同一（或另一）LINE 帳號，發一句含**高風險關鍵字**的訊息，例如：「我要退款」「可以折扣嗎」「價格有問題」。
2. **預期**：  
   - LINE 只收到**固定** handoff/ack（如「已收到，我們將由專員協助處理」），**不可**收到 AI 承諾式回覆。  
   - 後台或 DB 中 **ai_suggestions** 至少新增 **1 筆**，status=**draft**（或 pending，依 schema）。
3. **觀測**：跑下面「Supabase SQL 一」確認最新一筆 ai_suggestions 為 draft、created_at 為剛才時間。

---

### D3) 後台對話頁要能看到 draft（ai_suggestions）

1. 登入 production 後台 → **Dashboard → 對話**（或 **Conversations**）。
2. 點進在 D2 發高風險訊息的那位聯絡人。
3. **預期**：對話詳情或側欄中能看到「建議回覆」/ 草稿區，且該筆 draft 內容可見（可為固定 ack 文案或系統產生的建議）。
4. **失敗**：若完全看不到草稿，檢查 ai_suggestions 是否寫入（SQL 一）、以及前端是否依 contact_id / conversation 拉取 suggestions。

---

### D4) 一鍵送出 draft → LINE 只收到一次（防雙發）且 status 變 sent

1. 在後台對 **同一筆** draft 點「送出」（一鍵送出）。
2. **預期**：LINE 收到 **1 則** 訊息（該建議回覆內容）；ai_suggestions 該筆 status 變 **sent**，sent_at 有值。
3. 再對**同一筆**再點一次送出（或快速連點兩次）。
4. **預期**：第二次請求應回 **404** 或「Not found or already sent」；LINE **不會**收到第二則相同內容。
5. **觀測**：Supabase 該筆 ai_suggestions 僅一筆、status=sent、sent_at 只對應一次送出。

---

### D5) Internal process 驗證（若有 B1 / internal endpoint）

1. 若 production 已部署 **internal webhook-events process**（POST /api/internal/webhook-events/process）：  
   - 用**錯誤**的 **INTERNAL_QUEUE_SECRET**（或省略 Authorization）打 POST，body: `{"webhook_event_id":"<任意 uuid>"}`。  
   - **預期**：回應 **401** 或 **403**。
2. 用**正確**的 **INTERNAL_QUEUE_SECRET**（Header: `Authorization: Bearer <secret>`）打同一 endpoint、同一 body（若無真實 event_id 可接受 200 且無副作用）。  
   - **預期**：**200**（或 404 若該 id 不存在）；不應 401/403。
3. 若尚未部署 B1，此條可標為 N/A。

---

### D6) 觀測 DB：webhook_events / ai_suggestions 不應無限 pending

1. 若已套用 **B1 migration**（webhook_events 表存在）：  
   - 跑下面「Supabase SQL 三」看 webhook_events 狀態分佈。  
   - **預期**：pending 不會持續累積（有 QStash 或 drain 時會消化）；若無 queue，至少能手動呼叫 process/drain 消化。
2. 若尚未有 webhook_events：  
   - 僅確認 ai_suggestions 在 D2/D4 後有 draft → sent 的變化即可；pending 觀測標為 N/A。

---

## Supabase SQL（貼到 SQL Editor 執行）

### 一、ai_suggestions 最新 20 筆（id / status / created_at / sent_at）

```sql
SELECT id, status, created_at, sent_at
FROM public.ai_suggestions
ORDER BY created_at DESC NULLS LAST
LIMIT 20;
```

### 二、conversations 最新 20 筆（role / resolved_by / created_at）

```sql
SELECT id, contact_id, role, resolved_by, created_at
FROM public.conversations
ORDER BY created_at DESC NULLS LAST
LIMIT 20;
```

### 三、webhook_events 狀態分佈（pending / processing / done / failed）

```sql
SELECT status, count(*)
FROM public.webhook_events
GROUP BY status
ORDER BY status;
```

（若尚未套用 B1 migration 030，此表可能不存在，可略過或先建表再跑。）

---

## 通過標準

- **D1～D4**：必過（LINE 一般/高風險、後台見 draft、一鍵送出防雙發）。  
- **D5**：有 internal process 時必過；無則 N/A。  
- **D6**：有 webhook_events 時觀測 pending 不堆積；無則 N/A。  
跑完一輪並用上述 SQL 確認 ai_suggestions 有 draft → sent，即視為冒煙通過。
