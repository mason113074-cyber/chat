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

## 3. KV Store

- **程式使用**：`@vercel/kv`，並讀取 **`KV_REST_API_URL`**、**`KV_REST_API_TOKEN`**（見 `lib/cache.ts`、`lib/idempotency.ts`、`lib/rate-limit.ts`）。
- **Vercel KV 與 Upstash**：  
  Vercel KV 底層即 Upstash Redis，介面為 Upstash REST API；因此「Vercel KV」與「Upstash Redis」在程式端是同一組 env（`KV_REST_API_*`）。
- **結論**：
  - **目前使用的是「與 Vercel/Upstash 相容的 Redis」**，透過 `KV_REST_API_URL` + `KV_REST_API_TOKEN` 連線；實務上可能是 Vercel 的 KV 整合或直接建 Upstash Redis。
- **這兩個變數在哪設定**：
  - **未寫在 .env.example**，專案裡沒有預設範例。
  - **Vercel（正式環境）**：專案 → Settings → Environment Variables；若使用 Vercel 的 KV / Upstash Redis 整合，可從 Integration 自動注入，或手動新增 `KV_REST_API_URL`、`KV_REST_API_TOKEN`。
  - **本地**：在 `.env.local` 手動加入（不要提交到 Git）。

---

## 4. 技術債務改動（idempotency、rate-limit、cache 等）

- 已合併至 **main** 並推送到 GitHub。
- **Vercel** 會從 main 自動部署；上線後請在 Vercel 專案中設定 **`KV_REST_API_URL`**、**`KV_REST_API_TOKEN`**（或透過 Vercel Marketplace 的 Redis/KV 整合），冪等與 rate limit 才會在正式環境使用 Redis；未設定時會使用記憶體 fallback（單實例可運作，多實例建議一定要設）。

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
- **KV**：`KV_REST_API_URL` + `KV_REST_API_TOKEN` 在 **Vercel** 專案 Environment Variables 或 Redis/KV 整合中設定；本地在 `.env.local`。
