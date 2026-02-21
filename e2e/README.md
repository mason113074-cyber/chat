# E2E 測試

## E2E 對 Production（建議：不用 local）

- 部署 chat 到最新版（push main 觸發 Vercel 或手動 deploy）後，直接對 **https://www.customeraipro.com** 跑 E2E。
- 登入帳號由 `.env.local` 的 `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` 提供（須在 production 使用的 Supabase 專案中已存在且 email 已確認）。

```bash
# 對 production 跑完整 Chromium E2E（登入 + 所有 spec）
npm run test:e2e:prod:chromium
```

## 本機 E2E（Playwright + Chromium，選用）

- 需先 `npm run dev`；登入帳號與 Supabase 專案須一致（見上）。僅在需要測 local 時使用。
- `npm run check-e2e-supabase` 可檢查本機 `NEXT_PUBLIC_SUPABASE_URL` 是否為 chat 專案。
- `npm run test:e2e:chromium`：先檢查再跑本機 E2E。

## Production 完整流程（登入 + 所有頁面 + 截圖 + 報告）

在**真實 Chrome** 上對 customeraipro.com 執行完整 user flow、每頁截圖、記錄 console/頁面錯誤並產生報告。

### 1. 設定登入帳號

在 `.env.local` 設定測試用帳密（用於登入 customeraipro.com）：

```env
TEST_USER_EMAIL=your@email.com
TEST_USER_PASSWORD=yourpassword
```

### 2. 執行測試

```bash
# 無頭模式（背景執行）
npm run test:e2e:prod

# 有頭模式（可看到瀏覽器）
npm run test:e2e:prod:headed
```

會先執行 `auth.setup.ts` 登入並儲存 session，再執行 `full-flow-production.spec.ts` 走過：

1. 總覽 Dashboard  
2. 對話紀錄  
3. 客戶聯絡人  
4. 數據分析  
5. 方案與計費  
6. 知識庫  
7. 設定  

### 3. 產出

- **截圖**：`e2e/screenshots/production/01-dashboard.png` … `07-settings.png`
- **JSON 報告**：`e2e/test-report.json`（含每頁 URL、錯誤列表、通過與否）
- **Markdown 報告**：`e2e/test-report.md`（可讀摘要）

### 4. 依報告修復問題

查看 `e2e/test-report.md` 或 `e2e/test-report.json` 的 `allErrors`，依錯誤內容修改程式後再跑一次測試。

## 其他測試

- `npm run test:ui` — 本機全部 Playwright 測試（需先 `npm run dev` 或設 `TEST_BASE_URL`）
- `npm run test:ui:headed:prod` — Production 全部測試（有頭）
- `e2e/checklist.spec.ts` — 24 步 UI checklist（需已登入）
