# 正式網域與主要路由（唯一真實來源）

本文件為 **CustomerAIPro** 正式環境的網域與主要路由清單，供維運、文件與整合對照使用。

---

## 正式網域

- **唯一真實來源**：https://www.customeraipro.com  
- **GitHub Repo**：https://github.com/mason113074-cyber/chat.git  

---

## 主要路由（next-intl locale path）

以下皆以 `https://www.customeraipro.com` 為 base。

| 說明 | URL |
|------|-----|
| 首頁（繁中） | https://www.customeraipro.com/zh-TW |
| 儀表板 | https://www.customeraipro.com/zh-TW/dashboard |
| 對話 | https://www.customeraipro.com/zh-TW/dashboard/conversations |
| 聯絡人 | https://www.customeraipro.com/zh-TW/dashboard/contacts |
| 知識庫 | https://www.customeraipro.com/zh-TW/dashboard/knowledge-base |
| 分析 | https://www.customeraipro.com/zh-TW/dashboard/analytics |
| 自動化 | https://www.customeraipro.com/zh-TW/dashboard/automations |
| 行銷活動 | https://www.customeraipro.com/zh-TW/dashboard/campaigns |
| 設定 | https://www.customeraipro.com/zh-TW/dashboard/settings |

英文語系將 `zh-TW` 改為 `en` 即可（例如 `/en`、`/en/dashboard`）。

---

## API 與 Webhook

- **LINE Webhook（多 Bot）**：`https://www.customeraipro.com/api/webhook/line/{botId}/{webhookKey}`  
- **健康檢查**：`https://www.customeraipro.com/api/health-check`  
- **Cron 清理**：`https://www.customeraipro.com/api/cron/cleanup-webhook-events`（需設定 `WEBHOOK_CLEANUP_CRON_SECRET`）  

程式內請使用 `lib/app-url.ts` 的 `getAppUrl()`，勿硬編碼網域。

---

*最後更新：2026-02-25*
