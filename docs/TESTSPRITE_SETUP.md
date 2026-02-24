# TestSprite 測試設定

[TestSprite](https://www.testsprite.com) 為 AI 驅動的自動化測試平台，透過 MCP 與 Cursor 整合，可產生並執行 API、E2E 測試。

## 1. 取得 API Key

1. 前往 [TestSprite Dashboard](https://www.testsprite.com/dashboard) 註冊／登入。
2. 進入 **Settings → API Keys**，點 **Generate New API Key**。
3. 命名（例如 `Cursor MCP`）後複製產生的 key，**只會顯示一次，請妥善保存**。

## 2. 設定 MCP（本專案已預留）

專案 `.cursor/mcp.json` 已加入 TestSprite 伺服器，請將 API key 填入：

- 開啟 **Cursor Settings**（`Ctrl+,`）→ **Tools & Integration** → **MCP**。
- 找到 `TestSprite`，將 `YOUR_TESTSPRITE_API_KEY` 改為你在 TestSprite 產生的 API key。

或直接編輯 `.cursor/mcp.json`：

```json
"TestSprite": {
  "command": "npx",
  "args": ["@testsprite/testsprite-mcp@latest"],
  "env": {
    "API_KEY": "你的 TestSprite API key"
  }
}
```

**注意**：勿將真實 API key 提交至版控，可放在本機或 Cursor 的 MCP 設定中。

## 3. 環境需求

- **Node.js ≥ 22**（`node --version`）
- 本機可跑專案：`npm run dev`（預設 `http://localhost:3000`）
- 若需登入流程：在 TestSprite 設定中提供測試帳密（例如 `.env.local` 的 `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`）

## 4. Cursor 執行模式（建議）

TestSprite 需完整執行權限。在 Cursor：

- **Chat** → **Auto-Run** → **Auto-Run Mode** 改為 **Ask Every time** 或 **Run Everything**（不要用預設 Sandbox）。

## 5. 開始測試

1. 先啟動本機：`npm run dev`。
2. 在 Cursor Chat 中輸入：
   ```text
   Help me test this project with TestSprite.
   ```
3. AI 會透過 TestSprite MCP 進行：環境 bootstrap → 程式分析 → 產生標準化 PRD → 產生測試計畫 → 產生並執行測試 → 產出報告。

## 6. 查看結果

- **TestSprite Web Portal**：**Testing → MCP Tests** 可看每次執行狀態與詳細報告。
- **本機**：測試與報告會寫入專案下的 `testsprite_tests/`（可加入 `.gitignore` 避免提交）。

## 參考

- [TestSprite 文件](https://docs.testsprite.com)
- [Create Tests for New Projects](https://docs.testsprite.com/mcp/core/create-tests-new-project)
- [API Keys & MCP](https://docs.testsprite.com/web-portal/admin/api-keys)
