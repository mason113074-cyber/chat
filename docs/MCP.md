# MCP 總覽（Cursor Model Context Protocol）

本專案在 Cursor 中使用的 MCP 伺服器完整清單，設定檔：`.cursor/mcp.json`。  
**注意**：MCP 僅供編輯器/Agent 使用，repo 內程式碼不會直接呼叫 MCP。

---

## 1. 伺服器一覽

| 名稱 | 類型 | 用途 |
|------|------|------|
| **puppeteer** | 本機 (npx) | 瀏覽器自動化（Puppeteer） |
| **fetch** | 本機 (npx) | HTTP 請求（fetch URL） |
| **brave-search** | 本機 (npx) | Brave 搜尋 API（需 API Key） |
| **playwright** | 本機 (npx) | 瀏覽器自動化（Playwright） |
| **vercel** | 遠端 URL | Vercel 專案／部署操作 |
| **supabase** | 遠端 URL | Supabase 專案／資料操作 |
| **filesystem** | 本機 (npx) | 專案目錄檔案讀寫（限定路徑） |
| **memory-bank-mcp** | 本機 (npx) | Memory Bank 讀寫（memory-bank/） |
| **knowledge-graph-memory** | 本機 (npx) | 知識圖記憶（.mcp-knowledge-graph-memory.jsonl） |

---

## 2. 設定明細

### 2.1 遠端（URL）

| 名稱 | URL | 說明 |
|------|-----|------|
| **vercel** | `https://mcp.vercel.com` | 需在 Cursor 登入 Vercel；可查部署、專案、日誌等。 |
| **supabase** | `https://mcp.supabase.com/mcp` | 需在 Cursor 登入 Supabase；可查專案與資料。 |

**驗證**：Cursor → Settings → MCP，確認 "vercel" 與 "supabase" 顯示已連線且無錯誤。

---

### 2.2 本機指令型（npx）

| 名稱 | 指令 | 環境變數／參數 |
|------|------|----------------|
| **puppeteer** | `npx -y @modelcontextprotocol/server-puppeteer` | — |
| **fetch** | `npx -y @modelcontextprotocol/server-fetch` | — |
| **brave-search** | `npx -y @modelcontextprotocol/server-brave-search` | `BRAVE_API_KEY`（必填） |
| **playwright** | `npx @playwright/mcp@latest` | — |
| **filesystem** | `npx -y @modelcontextprotocol/server-filesystem c:/dev/saas/chat` | 限定目錄：專案根目錄 |
| **memory-bank-mcp** | `npx -y @movibe/memory-bank-mcp --path c:/dev/saas/chat --folder memory-bank` | 路徑與 folder 如上 |
| **knowledge-graph-memory** | `npx -y @itseasy21/mcp-knowledge-graph` | `MEMORY_FILE_PATH=c:/dev/saas/chat/.mcp-knowledge-graph-memory.jsonl` |

---

## 3. 依用途分類

- **部署／主機**：vercel  
- **資料／後端**：supabase  
- **瀏覽器／E2E**：puppeteer、playwright  
- **網路／搜尋**：fetch、brave-search  
- **專案檔案**：filesystem（僅專案目錄）  
- **記憶／脈絡**：memory-bank-mcp、knowledge-graph-memory  

---

## 4. 已知工具清單（參考）

### Vercel MCP（文件與稽核中已確認）

- `list_teams`, `list_projects`, `get_project`
- `list_deployments`, `get_deployment`
- `get_runtime_logs`, `get_deployment_build_logs`
- `deploy_to_vercel`
- `check_domain_availability_and_price`
- `web_fetch_vercel_url`, `get_access_to_vercel_url`
- `search_vercel_documentation`

**限制**：無「解除 Git 綁定」或「刪除專案」等工具，專案級設定需至 Vercel Dashboard 操作。  
詳見：`docs/REPORTS/VERCEL_CHAT_UNLINK_AUDIT.md`。

### Supabase / 其他

- 以 Cursor 連線後，於 MCP 介面或工具描述中可查看實際提供的 tools；本文件不逐一列舉。

---

## 5. 環境與注意事項

- **brave-search**：需至 [Brave Search API](https://brave.com/search/api/) 取得 `BRAVE_API_KEY`，並在 MCP 設定的 `env` 中填入；未設定則該 server 可能無法使用。
- **filesystem**：僅能存取 `c:/dev/saas/chat` 底下，避免 Agent 寫入系統其他路徑。
- **memory-bank-mcp**：與 `memory-bank/` 目錄及專案 Memory Bank 規則一致，見 `.cursor/rules` 與 `memory-bank/` 內說明。
- **knowledge-graph-memory**：記憶檔為專案根目錄下的 `.mcp-knowledge-graph-memory.jsonl`，可加入 `.gitignore` 若不想納入版控。

---

## 6. 與其他文件的關係

- **整合與連線檢查**：`docs/INTEGRATIONS_AND_MCP.md`（含 Supabase / LINE / OpenAI / Redis / Vercel 與 MCP 連線總覽）。
- **Vercel Agent 行為**：`.cursor/rules/vercel-agent.mdc`（不自動審查部署／PR，僅在請求時執行部署或狀態檢查）。
- **TestSprite**：若日後啟用 TestSprite MCP，設定方式見 `docs/TESTSPRITE_SETUP.md`（若存在）。

---

*最後更新：依 `.cursor/mcp.json` 與現有 docs 整理。*
