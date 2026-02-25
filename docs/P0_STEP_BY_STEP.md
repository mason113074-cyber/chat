# P0 任務逐步教學

三個 P0 項目：Supabase 密碼保護、ai_feedback RLS、React 18→19 升級。照順序做即可。

---

## P0-1：Supabase 啟用 HaveIBeenPwned 密碼保護

**目的：** 註冊/改密碼時檢查是否為已知洩漏密碼，降低帳號風險。

**誰做：** 你本人在瀏覽器操作（約 1 分鐘）。

### 步驟

1. **登入 Supabase**
   - 打開 https://supabase.com/dashboard
   - 登入你的帳號

2. **選專案**
   - 左側選你的 CustomerAIPro 專案（例如 `chat`）

3. **進 Auth 設定**
   - 左側選 **Authentication**
   - 再選 **Providers** 或 **Settings**（依介面版本）
   - 找到 **Password** 或 **Security** 相關區塊

4. **開啟洩漏密碼檢查**
   - 找到 **Leaked password protection** 或 **HaveIBeenPwned**
   - 把開關設為 **ON** / **Enable**
   - 若有選項「Check password on sign up / password change」可都勾選
   - 儲存

5. **驗證**
   - 之後用「已洩漏的測試密碼」註冊或改密碼，應被拒絕（若 Supabase 有提供測試用密碼可試一次）

**參考：** [Supabase 密碼安全文件](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## P0-2：修 ai_feedback RLS INSERT policy

**目的：** 目前 `WITH CHECK (true)` 等於任何人都能 INSERT，需改為僅 service role 可用。

**做法：** 在專案裡加一個 migration，然後在 Supabase 執行。

### 步驟

1. **在專案建立 migration 檔**
   - 路徑：`supabase/migrations/031_ai_feedback_rls_insert_restrict.sql`
   - 內容見下方「Migration 內容」

2. **在 Supabase 執行 migration**
   - **方式 A（Supabase Dashboard）：**
     - 左側 **SQL Editor** → New query
     - 把 migration 裡整段 SQL 貼上 → Run
   - **方式 B（CLI）：**
     - 若已裝 `supabase` CLI 且登入：在專案根目錄執行  
       `supabase db push`  
       或  
       `supabase migration up`

3. **驗證**
   - Dashboard → **Table Editor** → 選 `ai_feedback`
   - 用 **anon** 或 **authenticated** 角色試 INSERT（例如用 API 或 SQL Editor 切 role），應被 RLS 拒絕
   - 用 **service role**（後端 webhook/API 用的 key）應仍可 INSERT

### Migration 內容（031_ai_feedback_rls_insert_restrict.sql）

```sql
-- P0: Restrict ai_feedback INSERT to service_role only.
-- Previously: WITH CHECK (true) allowed any role to insert.

DROP POLICY IF EXISTS "Service role insert feedback" ON public.ai_feedback;

CREATE POLICY "Service role insert feedback" ON public.ai_feedback
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**說明：** 加上 `TO service_role` 後，只有用 service role key 的連線能套用這條 INSERT policy；anon/authenticated 沒有其他 INSERT policy，就無法寫入。

---

## P0-3：React 18 → 19 升級

**目的：** Next.js 16 建議搭配 React 19，避免相容性與未來升級問題。

**注意：** 必須 **react、react-dom、@types/react、@types/react-dom 四件一起升**，不可只升其中一兩個。

### 步驟

1. **確認環境**
   - 在專案根目錄執行：
     - `node -v`（建議 18+ 或 20+）
     - `npm run type-check`
     - `npm run build`
   - 確保目前 main 或你當前分支是綠的，再開始改依賴。

2. **改 package.json**
   - 把這四行的版本改成下面這樣（或你確認過可用的 19.x 版本）：
     - `"react": "^19.0.0"`
     - `"react-dom": "^19.0.0"`
     - `"@types/react": "^19.0.0"`
     - `"@types/react-dom": "^19.0.0"`
   - 存檔。

3. **重裝依賴**
   - 執行：`npm install`
   - 若有 lock 衝突或 peer 警告，依提示處理（通常 Next 16 會支援 React 19）。

4. **Type check**
   - 執行：`npm run type-check`
   - 若有型別錯誤，多半是 @types/react 19 的 breaking change，依報錯改元件（例如 `React.FC`、children 型別等）。

5. **Lint**
   - 執行：`npm run lint`
   - 有錯誤就修到通過。

6. **單元測試**
   - 執行：`npm run test:unit:run`
   - 失敗的通常是測試寫法或 mock 要配合 React 19 更新。

7. **建置**
   - 執行：`npm run build`
   - 必須成功才能算完成升級。

8. **本地手動點一點**
   - 執行：`npm run dev`
   - 開瀏覽器點主要頁面（首頁、dashboard、登入等），確認沒有 runtime 錯誤或版面錯亂。

9. **提交**
   - 例如：`git add package.json package-lock.json`（若有改其他檔案一併 add）
   - `git commit -m "chore(deps): upgrade React 18 to 19 (react, react-dom, @types)"`
   - 推分支、開 PR，讓 CI 再跑一輪。

### 若遇到問題

- **型別錯誤：** 查 [React 19 types changelog](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/README.md) 或錯誤訊息，常見是 `children` 不再預設在 props、或 `React.FC` 用法調整。
- **測試報錯：** 檢查是否用到已棄用的 API（例如舊的 `ReactDOM.render`），改成 `createRoot`；或更新 testing-library 到支援 React 19 的版本。
- **Next.js 報錯：** 確認 Next 版本支援 React 19（Next 16 應支援），必要時看 [Next.js  release notes](https://github.com/vercel/next.js/releases)。

---

## 完成後

- 在 Memory Bank 的 `tasks.md` 把三個 P0 項目標成完成。
- 若你有用 `active-context.md`，可寫一句「P0 全數完成，下一步 P1」。

完成以上三步，P0 就全部做完。
