# CustomerAIPro 部署與環境 FAQ

依專案**實際檔案與設定**整理，無法從 repo 判斷的會註明。

---

## 1. 部署平台

- **Repo 內狀況**：
  - 沒有 `vercel.json`、沒有 `railway.json`。
  - `.env.local` 曾出現 **`RAILWAY_PRIVATE_DOMAIN=chat.railway.internal`** → 代表至少**有使用或曾使用 Railway**（例如內部網域）。
- **結論**：
  - **無法從專案檔案判斷**「目前正式環境是 Railway 還是 Vercel」。
  - 若你只有一個部署，且 `.env.local` 是從該環境複製的，則**目前較可能是部署在 Railway**；若你有同時接 Vercel，需以實際綁定的網域／專案為準。

---

## 2. 網址 www.customeraipro.com

- **Repo 內僅有**：`package.json` 的 `test:ui:headed:prod` 使用  
  `TEST_BASE_URL=https://www.customeraipro.com`，代表**正式站網址是 www.customeraipro.com**。
- **結論**：  
  **www.customeraipro.com 實際指向哪個平台（Railway / Vercel / 其他）無法從 repo 得知**，需在 DNS 或該網域所綁定的專案（Vercel / Railway 後台）查看。

---

## 3. KV Store

- **程式使用**：`@vercel/kv`，並讀取 **`KV_REST_API_URL`**、**`KV_REST_API_TOKEN`**（見 `lib/cache.ts`、`lib/idempotency.ts`、`lib/rate-limit.ts`）。
- **Vercel KV 與 Upstash**：  
  Vercel KV 底層即 Upstash Redis，介面為 Upstash REST API；因此「Vercel KV」與「Upstash Redis」在程式端是同一組 env（`KV_REST_API_*`）。
- **結論**：
  - **目前使用的是「與 Vercel/Upstash 相容的 Redis」**，透過 `KV_REST_API_URL` + `KV_REST_API_TOKEN` 連線；實務上可能是 Vercel 的 KV 整合或直接建 Upstash Redis。
- **這兩個變數在哪設定**：
  - **未寫在 .env.example**，專案裡沒有預設範例。
  - 實際設定位置為**部署平台的環境變數**：
    - **Vercel**：專案 → Settings → Environment Variables；若用 Vercel 的 KV/Redis 整合，有時會自動注入。
    - **Railway**：專案 → Service → Variables。
    - **本地**：在 `.env.local` 或 `.env` 手動加入（不要提交到 Git）。

---

## 4. 剛才完成的技術債務處理（idempotency、rate-limit、cache 等）

- **Git 狀態（依對話當時）**：  
  diff 是 **「目前分支 vs main」**，代表這些改動在**目前分支**，**尚未合併到 main**。
- **因此**：
  - [x] **本地開發環境**：有這些改動（你在這分支開發）。
  - [ ] **已推送到 GitHub**：無法從 repo 檔案判斷你是否已 push 此分支。
  - [ ] **已部署到正式環境**：若正式環境是從 **main** 部署，則這些改動**尚未**上到正式環境；若正式環境是從「本分支」部署，則要看該分支是否已 push 且平台是否已拉最新碼並重部署。

**建議**：要讓技術債務改動上正式環境，需 (1) 將本分支 push 到 GitHub，(2) 合併進 main（或將正式環境改為從本分支部署），(3) 在部署平台觸發部署，並在該平台設定好 `KV_REST_API_URL`、`KV_REST_API_TOKEN`（若尚未設定）。

---

## 5. 專案資訊確認

| 項目 | 內容 |
|------|------|
| **GitHub repo** | `mason113074-cyber/chat`（依你提供的資訊） |
| **主要分支** | 預設為 **main**；目前技術債務改動在**另一分支**（尚未合併到 main） |
| **package.json 部署相關指令** | **沒有** `deploy` 指令。現有 scripts：`dev`、`build`、`start`、`lint`、`test:api`、`test:ui`、`test:ui:headed`、`test:ui:report`、`test:ui:headed:prod`。部署通常由 **Railway / Vercel 後台** 在 push 後自動執行 `build` + `start`（或等同指令）。 |

---

## 快速對照

- **部署平台**：Repo 僅能推論有使用 Railway；是否為唯一或正式環境需看實際部署設定。
- **www.customeraipro.com**：正式站網址，指向哪個平台需看 DNS／該網域綁定的專案。
- **KV**：用 `KV_REST_API_URL` + `KV_REST_API_TOKEN`，在**部署平台**或本地 `.env` 設定。
- **技術債務改動**：在分支上，未合併 main；是否已 push、是否已部署需你依上面步驟確認。
