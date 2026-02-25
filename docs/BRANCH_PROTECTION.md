# Branch Protection — main 分支保護設定

為避免未通過 CI 的程式合併進 main，建議在 GitHub 為 `main` 啟用 Branch protection rules。

## 使用 GitHub CLI（gh）設定

若已安裝並登入 GitHub CLI（`gh auth login`），可在 repo 根目錄執行以下指令，為 `main` 啟用 branch protection（需 merge 前通過 status check `ci`）：

```bash
gh api repos/mason113074-cyber/chat/branches/main/protection -X PUT \
  -f required_status_checks='{"strict":false,"contexts":["ci"]}' \
  -f enforce_admins=false \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":false,"require_code_owner_reviews":false}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

- **注意**：需具備 repo 的 **Admin** 權限；首次使用前請先執行 `gh auth login`。
- 若 Status check 名稱尚未出現，請先對 main 觸發一次 CI（例如 push 或 PR merge），再執行上列指令或改從網頁設定。

## 設定步驟（GitHub 網頁）

1. **進入設定**
   - 打開 repo：https://github.com/mason113074-cyber/chat
   - 上方 **Settings** → 左側 **Branches**

2. **新增規則**
   - 在 **Branch protection rules** 點 **Add rule**（或 Edit 既有規則）

3. **Branch name pattern**
   - 填 `main`（只保護 main）

4. **建議勾選**
   - **Require a pull request before merging**
     - **Require status checks to pass before merging** → 勾選後，下方 **Status checks** 可選：
       - 若有 GitHub Actions 的 job 名稱（如 `ci`），選 `ci`，表示該 job 通過才可 merge
     - 若 CI workflow 的 job 名稱為 `ci`（見 `.github/workflows/ci.yml`），就選 `ci`
   - **Require branches to be up to date before merging**（可選，會要求先 rebase/merge main 再通過 CI）
   - **Do not allow bypassing the above settings**（可選，連 admin 也需通過）

5. **儲存**
   - 點 **Create** 或 **Save changes**

## 注意

- 首次啟用「Require status checks」時，需至少有一次在 main 上跑過對應 workflow，Status 下拉才會出現可選的 check（例如 `ci`）。
- 若 repo 為 **private** 且未啟用 GitHub Actions 付費方案，確認 Actions 可跑再啟用 status check，否則可能無法 merge。
- 本專案 CI 為 `.github/workflows/ci.yml`，job 名稱為 `ci`；Dependency Review、CodeQL 為選用（preflight 未啟用時會 skip），可僅要求 `ci` 通過即可。

## 快速對照

| 項目 | 值 |
|------|-----|
| Repo | mason113074-cyber/chat |
| 保護分支 | main |
| 建議必過檢查 | `ci`（type-check / lint / unit / build） |
| 設定路徑 | Settings → Branches → Add rule / Edit |

---

*設定完成後可於 engineering-status.mdc 將「branch protection 未設定」改為「已完成」並註記日期。*
