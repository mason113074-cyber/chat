# CustomerAIPro 部署與環境 FAQ

依專案**實際檔案與設定**整理。

---

## 1. 部署平台

- **正式環境**：**Vercel**（已由 Railway 遷移）。
- **資料庫與認證**：**Supabase**（未變更）。
- 若本地 `.env.local` 仍留有 `RAILWAY_PRIVATE_DOMAIN`，可刪除，已不再使用。

---

## 2. 網址 www.customeraipro.com

- **正式站網址**：www.customeraipro.com（見 `package.json` 的 `test:ui:headed:prod`）。
- **指向**：DNS 應指向 **Vercel** 專案（與 Vercel 後台綁定網域一致）。

---

## 3. Redis（Upstash）

- **程式使用**：`@upstash/redis`，並讀取 **`UPSTASH_REDIS_REST_URL`**、**`UPSTASH_REDIS_REST_TOKEN`**（見 `lib/cache.ts`、`lib/idempotency.ts`、`lib/rate-limit.ts`）。
- **用途**：冪等（idempotency）、rate limit、各類快取；未設定時使用記憶體 fallback（單實例可運作，多實例建議一定要設）。
- **變數在哪設定**：
  - **.env.example**：已列出 `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`（註解範例）。
  - **Vercel（正式環境）**：專案 → Settings → Environment Variables，手動新增或透過 Upstash 整合注入。
  - **本地**：在 `.env.local` 手動加入（不要提交到 Git）。

---

## 4. 技術債務改動（idempotency、rate-limit、cache 等）

- 已合併至 **main** 並推送到 GitHub。
- **Vercel** 會從 main 自動部署；上線後請在 Vercel 專案中設定 **`UPSTASH_REDIS_REST_URL`**、**`UPSTASH_REDIS_REST_TOKEN`**，冪等與 rate limit 才會在正式環境使用 Redis；未設定時會使用記憶體 fallback（單實例可運作，多實例建議一定要設）。

---

## 5. 專案資訊確認

| 項目 | 內容 |
|------|------|
| **GitHub repo** | `mason113074-cyber/chat`（依你提供的資訊） |
| **主要分支** | **main**（技術債務改動已合併） |
| **package.json 部署相關指令** | **沒有** `deploy` 指令。現有 scripts：`dev`、`build`、`start`、`lint`、`test:api`、`test:ui`、`test:ui:headed`、`test:ui:report`、`test:ui:headed:prod`。部署由 **Vercel** 從 GitHub main 自動執行 `build` + `start`。 |

---

## 快速對照

- **部署平台**：**Vercel**（正式環境）；**Supabase**（資料庫與認證，未變更）。
- **www.customeraipro.com**：正式站網址，DNS 指向 Vercel。
- **Redis**：`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` 在 **Vercel** 專案 Environment Variables 中設定；本地在 `.env.local`。
