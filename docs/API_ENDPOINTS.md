# CustomerAIPro API 端點列表

## Table of Contents
- [認證 / Auth](#認證--auth)
- [設定](#設定)
- [知識庫](#知識庫)
- [Webhook / 聊天](#webhook--聊天)
- [聯絡人與標籤](#聯絡人與標籤)
- [對話](#對話)
- [分析](#分析)
- [帳單 / 訂閱](#帳單--訂閱)
- [健康檢查與其他](#健康檢查與其他)

---

## 認證 / Auth

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/auth/line` | LINE OAuth 登入入口（導向 LINE） |
| GET | `/api/auth/line/callback` | LINE OAuth callback，綁定帳號 |
| POST | `/api/auth/line/unbind` | 解除 LINE 綁定 |

---

## 設定

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/settings` | 取得目前使用者設定 |
| POST | `/api/settings` | 更新使用者設定 |
| GET | `/api/settings/line` | 取得 LINE Channel 設定（masked secret/token） |
| PUT | `/api/settings/line` | 更新 LINE Channel ID / Secret / Access Token |
| POST | `/api/settings/line/test` | 測試 LINE 連線 |
| POST | `/api/settings/preview` | 設定預覽 |

---

## 知識庫

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/knowledge-base` | 知識庫列表（分頁、搜尋、分類） |
| POST | `/api/knowledge-base` | 新增單筆知識庫 |
| PUT | `/api/knowledge-base/[id]` | 更新單筆知識庫 |
| DELETE | `/api/knowledge-base/[id]` | 刪除單筆知識庫 |
| POST | `/api/knowledge-base/import` | 批次匯入（body: `{ items: [{ title, content, category? }] }`） |
| POST | `/api/knowledge-base/test` | 測試知識庫（例如問句測試） |
| GET | `/api/knowledge-base/stats` | 知識庫統計 |
| GET | `/api/knowledge-base/search` | 知識庫搜尋 |

---

## Webhook / 聊天

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/webhook/line` | LINE Webhook 接收（訊息、事件） |
| GET | `/api/webhook/line` | LINE Webhook URL 驗證用 |
| POST | `/api/chat` | 儀表板內建聊天（body: `{ message }`，回傳 `{ content }`） |
| POST | `/api/test-ai` | 測試 AI 回覆 |

---

## 聯絡人與標籤

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/contacts` | 聯絡人列表 |
| GET | `/api/contacts/[id]` | 單一聯絡人 |
| GET | `/api/contacts/tags` | 標籤列表 |
| POST | `/api/contacts/tags` | 新增標籤 |
| PATCH | `/api/contacts/tags/[id]` | 更新標籤 |
| DELETE | `/api/contacts/tags/[id]` | 刪除標籤 |
| POST | `/api/contacts/[id]/tags` | 為聯絡人加標籤 |
| DELETE | `/api/contacts/[id]/tags/[tagId]` | 移除聯絡人標籤 |
| GET | `/api/tags` | 標籤列表（全域） |

---

## 對話

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/conversations/counts` | 對話計數（依狀態等） |
| PATCH | `/api/conversations/[id]/status` | 更新對話狀態 |
| PATCH | `/api/conversations/[id]/tags` | 更新對話標籤 |
| POST | `/api/conversations/[id]/reply` | 人工回覆客戶（支援 `suggestionId` 送出後標記建議為 sent） |
| GET | `/api/conversations/[id]/suggestions` | 取得 AI 建議回覆（預設 pending，可帶 `status`） |
| DELETE | `/api/conversations/[id]/suggestions/[suggestionId]` | 忽略/刪除 AI 建議回覆 |
| POST | `/api/conversations/batch` | 批次操作對話 |

---

## 分析

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/analytics/overview` | 分析總覽 |
| GET | `/api/analytics/trends` | 趨勢資料 |
| GET | `/api/analytics/resolution` | 解決率 |
| GET | `/api/analytics/hourly` | 每小時統計 |
| GET | `/api/analytics/top-contacts` | 熱門聯絡人 |
| GET | `/api/analytics/top-questions` | 熱門問題 |
| GET | `/api/analytics/quality` | 品質指標 |

---

## 帳單 / 訂閱

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/plans` | 方案列表 |
| GET | `/api/billing/usage` | 使用量（對話數等） |
| GET | `/api/usage` | 使用情況 |
| GET | `/api/subscription` | 訂閱狀態 |
| POST | `/api/subscription` | 建立/更新訂閱 |
| PATCH | `/api/subscription` | 更新訂閱 |
| GET | `/api/payments` | 付款記錄 |

---

## Onboarding / 其他

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/onboarding/status` | Onboarding 完成狀態 |
| POST | `/api/onboarding/save` | 儲存 Onboarding 進度 |
| GET | `/api/search` | 全域搜尋 |
| POST | `/api/line/verify` | LINE 驗證（例如 webhook 或設定驗證） |

---

## 健康檢查與測試

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/health-check` | 健康檢查彙總 |
| GET | `/api/health-check/history` | 健康檢查歷史 |
| GET | `/api/health/supabase` | Supabase 連線 |
| GET | `/api/health/openai` | OpenAI 連線 |
| GET | `/api/health/i18n` | i18n 檢查 |
| GET | `/api/health/security/rate-limit` | Rate limit 檢查 |
| GET | `/api/health/security/sensitive` | 敏感詞檢查 |
| GET | `/api/health/feature/handoff` | 轉人工功能檢查 |
| GET | `/api/test-alert` | 測試告警 |

---

## 認證方式

- **Cookie**：登入後由 Supabase 寫入，同一 domain 的 API 預設帶 Cookie。  
- **Bearer**：部分 API 支援 `Authorization: Bearer <token>`（Supabase session token）。  
- **Webhook**：`/api/webhook/line` 以 LINE 的 `x-line-signature` 驗證，不需登入。

---

*與 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 中 API 一節對應；實作細節以各 `app/api/**/route.ts` 為準。*
