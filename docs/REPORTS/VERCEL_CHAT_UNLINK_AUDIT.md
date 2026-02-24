# 稽核報告：Vercel 舊專案「chat」解除 Git 綁定

**目標**：讓 GitHub PR 的 Checks 不再出現「Vercel — chat」失敗，只保留「Vercel — chat-l27v」。  
**原則**：優先解除 Git 綁定（可逆），不影響 chat-l27v；未輸出任何 secret。

---

## 1) Step 1：兩個專案身分確認結果

### A) list_projects（teamId: mason4）

在 **team mason4**（mason）底下執行 `list_projects`，得到專案列表：

| 專案 name        | projectId                              |
|------------------|----------------------------------------|
| chat-l27v        | prj_04iLzkELCbteV7DZ7sBzhJ3xeRPq       |
| unsolvedrealmscom11 | prj_Uu8zmhaYQovK7q7d3uJO7Ue6bJAY   |
| unsolvedrealmscom   | prj_kRDONEnqKdRhTbCRxgS3xI5IMbvl   |
| sanitationos     | prj_0ulkvgyhVlhpW1NgeJZV0ikAKiKl       |
| renderdrop-app   | prj_MHJ922xfDy8FHAmA8gpltbZvNNSt       |
| renderdrop-site  | prj_Z4a1lU8P6xc4h4POVyS638TIQbVl       |

**結論**：在 team mason4 底下**沒有**名為 **chat** 的專案。  
對 `get_project(projectId: "chat", teamId: team_Sknq78Yb32wqsF8DEmzW65CQ)` 回傳 **404 Not Found**。

因此「chat」極可能屬於**個人帳號（Personal Account）**底下的專案，而不是 team mason4；或已在他處刪除，僅剩 PR 上歷史 check 名稱。

### B) get_project 結果（僅能查到的專案）

**chat-l27v**（projectId: prj_04iLzkELCbteV7DZ7sBzhJ3xeRPq）：

| 項目 | 值 |
|------|-----|
| name | chat-l27v |
| domains | chat-l27v.vercel.app, www.customeraipro.com, chat-l27v-mason4.vercel.app, chat-l27v-git-main-mason4.vercel.app, **customeraipro.com** |
| latestDeployment.readyState | **READY** |
| latestDeployment.url | chat-l27v-2t44augmn-mason4.vercel.app |

**判斷**：chat-l27v 為**正主**，綁定 customeraipro.com / www.customeraipro.com，**禁止對其做任何解除綁定或刪除**。

**chat**：MCP 無法取得（404）；未取得 domains / latestDeployment。

---

## 2) Step 2：採用的方案與實際操作

### MCP 能力邊界

- 已確認的 Vercel MCP 工具：list_teams, list_projects, get_project, list_deployments, get_deployment, get_runtime_logs, get_deployment_build_logs, deploy_to_vercel, check_domain_availability_and_price, web_fetch_vercel_url, get_access_to_vercel_url, search_vercel_documentation。
- **沒有**「解除 Git 綁定」或「刪除專案」的 MCP 工具。
- 在 team mason4 下**查不到**「chat」專案，無法透過 MCP 對其執行任何動作。

### 採用方案：Vercel Dashboard 手動「解除 Git 綁定」

因 MCP 無法操作「chat」，改由**精準的 Dashboard 點擊步驟**完成解除綁定（可逆、風險最低）。

---

## 3) 請你手動執行的 Dashboard 步驟（解除 Git 綁定）

若你在 Vercel 介面仍看得到「chat」專案，請依下列步驟操作（不要動 chat-l27v）：

1. **登入 Vercel**  
   打開 https://vercel.com 並登入。

2. **切到正確的 Scope**  
   - 若「chat」在 **個人帳號**：左上角選你的頭像/個人帳號，不要選 team「mason4」。  
   - 若「chat」在 **mason4**：選 team「mason4」，再在專案列表找「chat」（若找不到，表示 chat 在個人帳號下）。

3. **進入 chat 專案**  
   - 在 **Dashboard** 的專案列表中，點選專案名稱 **chat**（不要點 chat-l27v）。

4. **打開 Git 設定**  
   - 上方分頁點 **Settings**。  
   - 左側選單點 **Git**。

5. **解除連結**  
   - 在 **Connected Git Repository** 區塊找到 **Disconnect**（或「Remove Git Repository」/「Disconnect repository」）按鈕。  
   - 點 **Disconnect**，依畫面確認（若有）。

6. **儲存後離開**  
   - 儲存後回到該專案的 **Deployments**。  
   - 之後同一 GitHub repo 的 PR 不應再觸發「chat」的新部署，PR checks 也不會再出現「Vercel — chat」。

**若畫面上沒有「chat」專案**：  
表示可能已在其他帳號/團隊刪除，或從未在目前帳號下建立；此時 PR 上的「Vercel — chat」可能是**歷史 check**，需用下方「Step 4 驗證」用空 commit 觸發新一輪 checks 確認是否仍會出現。

---

## 4) Step 3：是否刪除「chat」專案（可選）

- **建議**：先只做「解除 Git 綁定」，觀察 PR 不再出現「Vercel — chat」即可；**不一定要刪除**專案。
- 若你**確認**「chat」沒有任何 production domain、無人使用，再考慮刪除：
  1. 同上進入 **chat** 專案 → **Settings**。  
  2. 拉到最下方 **Danger Zone**（或「Delete Project」）。  
  3. 按 **Delete Project**，依提示輸入專案名稱確認。  
- **風險**：刪除為**不可逆**；若該專案有綁定網域，刪除後該網域會失效。解除綁定則可逆，之後可再連回同一個或別的 Git repo。

---

## 5) Step 4：驗證（請你執行並確認）

### (1) Vercel 端

- 進入 **chat** 專案（若仍存在）→ **Settings** → **Git**：  
  **Connected Git Repository** 應顯示已斷開，或無連結的 repo。
- 進入 **chat-l27v** → **Deployments**：  
  最近部署仍為 READY，且可正常開啟 customeraipro.com。

### (2) GitHub PR 端

- 打開任一連到 `mason113074-cyber/chat` 的 PR（例如 PR #14）。
- **預期**：新一輪 checks 中**不再出現**「Vercel — chat」；僅有「Vercel — chat-l27v」。
- 若舊的失敗 check 仍掛在 PR 上，可**重跑 checks** 或推**空 commit** 觸發新一輪：

  ```bash
  git checkout <你的PR分支>
  git commit --allow-empty -m "chore: retrigger vercel checks"
  git push
  ```

  推送後到 PR 頁面看 **Checks**，應只剩 chat-l27v 的結果。

---

## 6) 風險與注意事項

- **不要對 chat-l27v 做 Disconnect 或 Delete**：該專案綁定 customeraipro.com / www.customeraipro.com，動到會影響正式站。
- **刪除專案不可逆**：若未來可能要用同名的「chat」專案，建議只做解除 Git 綁定，不刪除。
- **PR 歷史**：舊的「Vercel — chat」失敗紀錄可能仍顯示在 PR 上，不影響新 commits；用空 commit 或 re-run 後只看新 checks 即可。
- **多帳號/多 team**：若你有個人帳號與 mason4，記得在正確的 scope 下找「chat」；MCP 僅能查 team mason4，故無法代你列出個人帳號專案。

---

## 7) 報告摘要

| 項目 | 結果 |
|------|------|
| 查到的專案（team mason4） | chat-l27v（正主，含 customeraipro.com）、其他 5 個；**無 chat** |
| chat 專案 | get_project("chat") → 404，推測在個人帳號或已不存在 |
| 實際執行 | 未透過 MCP 改動任何專案；提供 Dashboard 解除 Git 綁定步驟 |
| chat-l27v | 未做任何變更；domains / latestDeployment 已記錄於上文 |
| 驗證 | 需你本機：Vercel Settings → Git 確認 chat 已斷開；PR 推空 commit 後確認僅剩「Vercel — chat-l27v」 |

完成上述手動步驟並通過驗證後，即可視為「Vercel — chat」已不再影響 PR checks。
