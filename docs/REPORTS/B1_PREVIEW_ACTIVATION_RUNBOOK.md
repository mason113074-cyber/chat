# B1 Preview 啟動 Runbook + 驗收清單 + 故障排查

**目標**：在 Vercel Preview（chat-l27v）把 B1（persist+enqueue+200, push-only）跑起來並可稽核。  
**限制**：不輸出任何 secret 值；環境變數須在 Vercel Dashboard 手動設定；Vercel Cron 在 Preview 不跑。

---

## A) 為什麼 B1 會「看起來沒回覆」

**一句話**：B1 webhook 只負責「驗簽 → 寫入 `webhook_events`(pending) → enqueue（或略過）→ 立刻回 200」；**真正回覆 LINE 的是「背景處理器」**，會去呼叫 `POST /api/internal/webhook-events/process`，用 `pushMessage` 回用戶。  
=> **若背景處理器沒跑**（沒設 QStash、也沒手動打 process/drain），`webhook_events` 會一直 pending，LINE 也收不到回覆。不是 webhook 壞掉，是「處理」沒被觸發。

---

# 1) B1 Preview Activation Runbook（照做就會動）

## Step 0：確認 PR 已建立

- 若尚未建立 PR，請用此連結建立：  
  https://github.com/mason113074-cyber/chat/compare/main...b1/event-queue-multibot?expand=1  
- 標題建議：`B1: Event queue + multibot + copilot (persist+enqueue+200, push-only)`  
- 建立後請把 **PR URL** 貼給助理。

## Step 1：取得 Preview 部署 URL

- 若已 push 過 `b1/event-queue-multibot`，Vercel 會自動建 Preview。  
- **目前已知 B1 Preview URL**（依 Vercel deployments）：  
  `https://chat-l27v-25wxwnwz8-mason4.vercel.app`  
  （branch: b1/event-queue-multibot, state: READY）  
- 若之後有新的 deploy，請到：**Vercel Dashboard → 專案 chat-l27v → Deployments**，找到 ref 為 `b1/event-queue-multibot` 的那一筆，點進去複製 **Visit** 的 URL，即為 Preview URL。  
- 若列表裡沒有 b1 的部署：在 repo 對 `b1/event-queue-multibot` 再 **push 一次**（空 commit：`git commit --allow-empty -m "chore: trigger preview" && git push`），或到 **Vercel → chat-l27v → Deployments → 該分支 deployment → 右上「⋯」→ Redeploy**。

## Step 2：在 Vercel 設定 Preview 環境變數（手動）

**（可選）本機掃描 env 需求，避免漏設**：在 repo 根目錄執行：

```bash
rg "process\.env\.[A-Z0-9_]+" -o --no-filename | sort -u
```

會列出程式裡用到的所有 `process.env.*` 變數名稱；B1 重點是下面表格那些。

**路徑**（一步一步）：

1. 打開瀏覽器，登入 Vercel，進到 **Team / 你的 team**。
2. 左側或首頁點專案 **chat-l27v**。
3. 上方分頁點 **Settings**。
4. 左側選 **Environment Variables**。
5. 每個變數新增時，**Environment** 請勾選 **Preview**（不要只勾 Production）。
6. 依下表新增或編輯，**Value** 由你在本機用 `openssl rand -hex 32` 產生（不要貼到 Runbook 裡）。

**B1 必要變數表**（僅列名稱與用途；值請自行產生並填入）：

| 變數名稱 | Preview 必填 | 作用 | 沒設時常見症狀 |
|----------|--------------|------|----------------|
| ENCRYPTION_MASTER_KEY | ✅ 必填 | B1 envelope 加解密（新建 bot 用） | webhook/process 解密 500、Configuration error |
| LINE_BOT_ENCRYPTION_KEY | ✅ 建議 | 舊 bot 密鑰 fallback（P0 建立的 bot） | 舊 bot 解密失敗 500 |
| INTERNAL_QUEUE_SECRET | ✅ 必填 | 驗證 process、drain 呼叫（Bearer） | process 回 401 Unauthorized |
| HEALTHCHECK_CRON_SECRET | ✅ 建議 | drain 端驗證（手動打 drain 時用） | 手動打 drain 回 401 |
| QSTASH_TOKEN | 可選 | 有設則 webhook 會 enqueue，QStash 打 process | 不設則 enqueue 不做，pending 只能靠手動 process/drain 消化 |
| APP_URL | ✅ 強烈建議 | drain 組 process 用；應為「當前 Preview 的 base URL」 | 未設會用 VERCEL_URL；若組錯會打錯 host，process 不跑、pending 堆積 |
| NEXT_PUBLIC_APP_URL | 可選 | 部分程式用於組 URL；可與 APP_URL 同值 | 若只設 APP_URL 多數情境已夠 |

**操作方式**（每個變數）：

- 點 **Add New** 或 **Edit**。
- **Key**：上表變數名稱（一個字都不能錯）。
- **Value**：你本機產生的值（例如 `openssl rand -hex 32` 輸出）。
- **Environment**：勾選 **Preview**（必要）。
- 儲存後，若要立即生效：**Deployments → 該 Preview deployment → ⋯ → Redeploy**。

**重要**：  
- **不要依賴 Preview 的 Cron**。Vercel Cron 只跑 Production，Preview 不會每分鐘跑 drain。  
- 要在 Preview「自動」消化 pending：請設 **QSTASH_TOKEN**（並在 QStash 後台把 destination 指到你的 Preview URL）。  
- 不設 QStash：只能**手動**打 process 或 drain 來驗收（見下方「方式 2」）。

## Step 3：確認 APP_URL 指到當前 Preview

- 在 Environment Variables 裡，**APP_URL**（或 NEXT_PUBLIC_APP_URL）應為當前 Preview 的 base URL，例如：  
  `https://chat-l27v-25wxwnwz8-mason4.vercel.app`  
- 若你後來換了 deployment（例如重新 deploy），請把 APP_URL 更新成新 Preview URL，並再 Redeploy 一次，否則 drain 會打錯網址。

## Step 4：驗證「背景處理器」有在跑（三選一或都做）

- **方式 1**：看 Supabase（見 §D 方式 1）。  
- **方式 2**：手動打 process/drain（見 §D 方式 2）。  
- **方式 3**：看 Vercel Runtime Logs（見 §D 方式 3）。

---

# 2) 驗收清單（DoD）— 做完這些才算 B1 Preview 可用

| # | 項目 | 操作 | 預期結果 | 若失敗可能代表 |
|---|------|------|----------|----------------|
| 1 | 一般問題 end-to-end | LINE 發一般文字 → 等幾秒 | webhook_events 先出現 pending，process 後變 done；LINE 收到 push 回覆 | process 沒被呼叫、401、decrypt 500、或 APP_URL 錯 |
| 2 | 高風險不送 AI | LINE 發含退款/折扣等敏感詞 | `ai_suggestions` 出現一筆 draft；LINE 只收到固定 ack（例如「已收到，我們將由專員協助處理」），沒有 AI 生成句 | 決策層或關鍵字未生效 |
| 3 | 無 sources/低信心 | 發知識庫沒涵蓋或邊緣問題 | 只寫 draft + 推固定 handoff（例如「這個問題需要專人為您處理」），不 AUTO 送 AI 回覆 | 信心/來源判斷或閾值設定問題 |
| 4 | 防雙發 | 同一筆 suggestion 連點兩次「送出」 | 第一次成功；第二次 404 或「Not found or already sent」，且 LINE 只收到一則 | atomic status transition 未生效或前端重複送 |
| 5 | internal process 驗證 | 用錯 secret 打 process → 再用正確 secret 打 | 錯 secret → 401/403；正確 Bearer → 200，且該筆 webhook_events 變 done（或 failed 有 last_error） | INTERNAL_QUEUE_SECRET 未設或 header 錯誤 |
| 6 | backlog 不堆積 | 發幾則訊息後觀察 1～2 分鐘 | pending 數量會下降（有 QStash 或手動 drain）；不會無限成長 | QStash 未設且未手動 drain；或 process 一直 401/500 |

---

# 3) 背景處理器「真的有在跑」— 三種驗收方式

## 方式 1：Supabase 觀測（最直覺）

在 Supabase SQL Editor 跑：

```sql
-- 1) 看 queue 各狀態數量
SELECT status, count(*)
FROM webhook_events
GROUP BY status
ORDER BY status;

-- 2) 最近 20 筆事件
SELECT id, status, created_at, processed_at, last_error, attempts
FROM webhook_events
ORDER BY created_at DESC
LIMIT 20;
```

**正常情況**：有在處理時，pending 會隨時間減少，done（或 failed）會增加；processed_at 會有值。

## 方式 2：手動觸發（Preview 沒 QStash 時必用）

**打 process（單筆）**：

- URL：`https://<你的-Preview-URL>/api/internal/webhook-events/process`  
  例如：`https://chat-l27v-25wxwnwz8-mason4.vercel.app/api/internal/webhook-events/process`
- Method：`POST`
- Headers：  
  `Content-Type: application/json`  
  `Authorization: Bearer <INTERNAL_QUEUE_SECRET>`
- Body（JSON）：  
  `{ "webhook_event_id": "<從 webhook_events 表複製一筆 pending 的 id>" }`

成功時：HTTP 200，body 約 `{"success":true}`；Supabase 該筆 status 變 `done` 或 `failed`，processed_at 有值。

**打 drain（一次清多筆 pending）**：

- URL：`https://<你的-Preview-URL>/api/internal/webhook-events/drain`
- Method：`POST`
- Headers：  
  `Authorization: Bearer <HEALTHCHECK_CRON_SECRET>`  
  （程式裡 drain 只認 HEALTHCHECK_CRON_SECRET；可接受 `Bearer <secret>` 或直接 `<secret>`）

成功時：HTTP 200，body 如 `{"drained":3}`；多筆 pending 會依序被 process 消化。

## 方式 3：Vercel Logs 驗收

- **Vercel Dashboard** → **chat-l27v** → **Deployments** → 點該 Preview deployment → **Logs**（或 **Runtime Logs**）。
- 可搜尋關鍵字：
  - `decrypt failed` / `Decrypt failed` → 加解密 key 或格式問題
  - `Unauthorized` / `401` → process/drain 驗證失敗（secret 或 header）
  - `Enqueue failed` / `[QStash]` → QStash 未設或 URL/token 錯
  - `B1 events landed` → webhook 有寫入事件
  - `LINE webhook` / `processOneWebhookEvent` / `pushMessage` → 處理與送 LINE 的流程

---

# 4) 故障排查樹（Troubleshooting）

| 現象 | 可能原因 | 怎麼確認 / 怎麼修 |
|------|----------|-------------------|
| **T1) webhook_events 一直 pending** | QStash 沒打到 process；或 process 401；或 APP_URL 組錯 | 1) 查 Vercel env：QSTASH_TOKEN、APP_URL 是否設對、是否為此 Preview URL。2) 手動用正確 Bearer 打 process，看是否 200 且該筆變 done。3) 看 Runtime Logs 有無 401、Enqueue failed。 |
| **T2) process 回 401/403** | INTERNAL_QUEUE_SECRET 未設、設錯、或 header 不是 `Authorization: Bearer <secret>` | 1) Vercel → Settings → Environment Variables → Preview，確認 INTERNAL_QUEUE_SECRET 存在且與你 curl 帶的一致。2) 確認是 `Authorization: Bearer <值>`，不是別的 header 名或少了 Bearer。 |
| **T3) decrypt 500 / Configuration error** | ENCRYPTION_MASTER_KEY 或 LINE_BOT_ENCRYPTION_KEY 未設、格式錯、或與寫入時用的 key 不一致 | 1) 新建 bot 用 envelope（ENCRYPTION_MASTER_KEY）；舊 bot 用 LINE_BOT_ENCRYPTION_KEY。2) 兩把 key 不要混用（同一 bot 用同一把）。3) 64 hex 最穩，用 `openssl rand -hex 32` 產生。 |
| **T4) QStash 驗簽失敗** | QStash 的 signature 與後端驗法不符 | 暫時可關閉驗簽或改用 Bearer：用 INTERNAL_QUEUE_SECRET 手動 POST 到 process 能 200，代表邏輯沒問題；QStash 驗簽需對照 Upstash 文件與你程式裡的驗證方式。 |
| **T5) LINE 沒收到 push** | bot token 錯、line_user_id 錯、或 LINE API 回錯 | 看 Vercel Runtime Logs 有無 LINE API 錯誤；確認 line_bots 該筆的 encrypted_channel_access_token 能正確解密且 token 有效；確認 raw_event 裡 source.userId 存在。 |
| **T6) suggestions 送出變雙發** | atomic update 沒鎖住（draft→sent） | 查 DB：同一 suggestion_id 不應出現兩筆 conversations 來自同一則 suggested_reply。若出現兩次送出的紀錄，代表前端或 API 未用「update where status=draft returning」的原子邏輯。 |

---

# 5) Vercel Dashboard 路徑速查（手動操作用）

- **專案**：Vercel → 選 **chat-l27v**。
- **環境變數**：Settings → Environment Variables → 新增/編輯時 **Environment 選 Preview** → Save。
- **Preview URL**：Deployments → 點 ref 為 **b1/event-queue-multibot** 的那一列 → 右側 **Visit** 或複製上方網址。
- **Redeploy**：Deployments → 點該 Preview 部署 → 右上 **⋯** → **Redeploy**。
- **Logs**：點進該 deployment → **Logs** 或 **Runtime Logs**。

---

# 6) 請回覆這兩項（方便精準幫你查 logs / 清 pending）

1. **B1 PR 連結**（Create PR 後的 GitHub PR URL）  
2. **Preview 部署 URL**（例如 `https://chat-l27v-25wxwnwz8-mason4.vercel.app`）

有了這兩個，可以用 Vercel MCP 對該 deployment 查 build/runtime logs，並依 Supabase 的 pending 清單帶你手動打 process/drain 把 pending 清掉並驗收。
