# 倉庫風險與建議處理方式

本文件對應稽核報告「六、風險與建議」，逐項說明**建議處理方式**。

---

## 1. 單一硬編碼 URL

**風險**：`app/[locale]/page.tsx` 的 `SITE_URL` 若寫死，不同環境（staging、本機）的 Open Graph 會指向正式站。

**處理**：已改為 `process.env.NEXT_PUBLIC_APP_URL || 'https://www.customeraipro.com'`，與其他路由一致。正式站 Vercel 請設 `NEXT_PUBLIC_APP_URL=https://www.customeraipro.com`。

---

## 2. Build 本地失敗（Windows EBUSY）

**風險**：本機 `npm run build` 有時因 Windows 檔案鎖（EBUSY）失敗。

**處理**：屬環境問題，不需改程式。以 **GitHub Actions CI 的 build 結果**為準；若 CI 為綠即可合併。本機若需驗證，可多跑一次或改用 WSL。

---

## 3. 單元測試雜訊

**風險**：rate-limit 測試的 fallback 日誌、TestDashboard 的 `act()` 與 jsdom canvas 警告，不影響通過但造成 log 雜訊。

**處理**：可之後收斂：  
- rate-limit：測試中 mock `console` 或接受為預期行為。  
- TestDashboard：非同步更新用 `act()` 包一層，或 a11y 測試略過 canvas（需安裝 `canvas` 或改用 headless 瀏覽器）。  
非阻擋項，有餘力再做。

---

## 4. 分支數量多

**風險**：遠端有大量已合併/關閉的 copilot、dependabot、fix 分支，列表雜亂。

**處理**：依 **`docs/BRANCH_CLEANUP_PLAN.md`** 在 **GitHub 網頁** 手動刪除：Pull requests → Closed → 對已 merge 的 PR 點「Delete branch」；Branches 頁刪除確定不再使用的遠端分支。不要用腳本大量刪除，避免誤刪。

---

## 5. 安全掃描（CodeQL / Dependency graph）

**風險**：若 repo 為 private，未啟用 Code scanning 或 Dependency graph 時，對應 workflow 會 skip（已設計為 notice 不擋 PR）。

**處理**：在 **GitHub → Settings → Code security and analysis**：  
- 啟用 **Dependency graph**：Dependency Review workflow 才會真正跑。  
- 啟用 **Code scanning**（若方案支援）：CodeQL 才會跑。  
詳見 **`docs/GITHUB_REPO_SETTINGS_CHECKLIST.md`** 的 C) 節。

---

## 總結

| 項目           | 處理方式                         |
|----------------|----------------------------------|
| 硬編碼 URL     | 已改為 env + fallback（程式）   |
| 本機 build 失敗| 以 CI 為準，不改程式            |
| 單元測試雜訊   | 可之後收斂，非必須              |
| 分支多         | 依 BRANCH_CLEANUP_PLAN 手動清理 |
| 安全掃描       | GitHub Settings 啟用功能        |
