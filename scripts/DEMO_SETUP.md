# 產品 Demo 錄影環境準備

錄影腳本 `record-demo.spec.ts` 會對 production 或測試環境執行完整 walkthrough。建議事先準備專用 demo 帳號與資料，畫面更完整。

---

## 1. 建議：專用 Demo 帳號

建立一個僅用於錄影的帳號，避免與日常測試混用：

| 項目 | 建議值 |
|------|--------|
| Email | `mason113074@gmail.com`（或自訂） |
| Password | 自訂密碼，**勿提交到 repo** |

**帳密設定方式：** 在專案根目錄建立 `.env.demo.local`（已被 `.gitignore` 忽略），例如：

```env
DEMO_EMAIL=mason113074@gmail.com
DEMO_PASSWORD=你的密碼
```

錄影腳本會讀取 `DEMO_EMAIL` / `DEMO_PASSWORD`；未設定時會使用預設佔位帳號（可能無法登入 production）。

---

## 2. 現有測試環境可選準備

若在測試環境錄影，可事先做以下準備，讓畫面更有說服力：

- **知識庫**：預先上傳 2～3 個範例知識庫（例如 FAQ、營業時間、方案說明），方便在「Test Chat」場景展示問答。
- **LINE Integration**：在 Settings → LINE 填好 Channel Secret / Access Token（可用假 token 僅作畫面展示，不實際發送）。
- **Dashboard 數據**：確保 Dashboard 有模擬數據（對話數、AI 回覆率、平均回覆時間等），錄影時指標與圖表較充實。

---

## 3. 執行錄影

```bash
npm run test:demo
# 或看瀏覽器：npm run test:demo:headed
```

影片輸出目錄：`demo-recordings/`（使用 `playwright.demo.config.ts` 時）。
