# Crisp P1–P3 實作計畫

目標：**P1、P2、P3 全做**。以下依階段拆成可執行任務與交付物。

---

## Phase 1：P1 高價值功能

### 1.1 多管道收件匣（Email / 聯絡表單進 Inbox）

| 任務 | 交付 | 狀態 |
|------|------|------|
| 聯絡表單 API：`POST /api/inbox/contact-form` 建立 contact + 首則 conversation | API + 文件 | 待做 |
| 選填：Email 收信 (Resend/SMTP inbound) → 建立或綁定 conversation | 依資源 | 待做 |

### 1.2 知識庫擴充（PDF、選做爬站）

| 任務 | 交付 | 狀態 |
|------|------|------|
| PDF 上傳 API：`POST /api/knowledge-base/import-pdf`，解析文字寫入知識庫 | API + 依方案限制 | 待做 |
| 選做：URL/sitemap 爬取 → 知識庫條目 | 依資源 | 待做 |

### 1.3 AI 回答品質與迭代（Validate & Measure）

| 任務 | 交付 | 狀態 |
|------|------|------|
| 單則訊息「標記錯誤/正確」API + 寫入 DB | 沿用 ai_feedback | 已有 |
| ai-quality 頁：低信心問題「一鍵納入知識庫」 | UI + `POST /api/knowledge-base/from-conversation` | ✅ |
| 報表：AI 滿意度 / 標記統計（可沿用現有 ai-quality API） | 已有 | ✅ |

### 1.4 內部備註（Private notes）

| 任務 | 交付 | 狀態 |
|------|------|------|
| DB：獨立表 `conversation_notes` | migration 028 | ✅ |
| API：GET/POST `/api/contacts/[id]/notes` | 完成 | ✅ |
| 對話詳情頁：備註區塊、僅團隊可見、不送 LINE | UI | ✅ |

### 1.5 Campaigns 完整化（LINE Broadcast）

| 任務 | 交付 | 狀態 |
|------|------|------|
| LINE Broadcast API 串接（或官方限制時用多則 push 模擬） | 發送邏輯 | 待做 |
| 排程發送、送達率/讀取率欄位（可先假資料或 webhook 回填） | campaigns 表 + UI | 待做 |

---

## Phase 2：P2 逐步補齊

### 2.1 Ticketing 產品化

| 任務 | 交付 | 狀態 |
|------|------|------|
| contacts：ticket_number、ticket_priority、assigned_to_id | migration 028 + PATCH contacts | ✅ |
| 對話詳情：顯示工單區塊（有資料時） | UI | ✅ |

### 2.2 路由與指派（Routing rules）

| 任務 | 交付 | 狀態 |
|------|------|------|
| 規則表：條件（標籤/關鍵字/來源）→ 指派對象或標籤 | migration + API | 待做 |
| 設定頁「路由規則」區塊 + 建立/編輯/刪除 | UI | 待做 |

### 2.3 自動化情境範本庫

| 任務 | 交付 | 狀態 |
|------|------|------|
| 內建 2–3 個流程範本（FAQ、轉人工、收集資訊） | 種子資料或靜態 JSON | 待做 |
| 自動化頁：「從範本建立」→ 複製節點到新 workflow | UI | 待做 |

### 2.4 整合與連接（Webhook、API Key）

| 任務 | 交付 | 狀態 |
|------|------|------|
| api_keys 表 + 產生/撤銷 API Key API | migration 028 + GET/POST/DELETE /api/settings/api-keys | ✅ |
| 設定頁：API Key 管理、Webhook URL 說明與文件連結 | 待補 UI | 待做 |
| 選做：Zapier/Make 範例 | 文件或範本 | 待做 |

### 2.5 白標（White labelling）

| 任務 | 交付 | 狀態 |
|------|------|------|
| users：branding_logo_url、branding_primary_color、branding_hide_powered_by | migration 028 | ✅ |
| Layout/登入頁/Widget：讀取並套用 | UI | 待做 |

---

## Phase 3：P3 中長期

### 3.1 Status Page

| 任務 | 交付 | 狀態 |
|------|------|------|
| 公開頁 `/[locale]/status`：營運狀態、維護/故障公告 | 靜態頁 | ✅ |

### 3.2 進階分析

| 任務 | 交付 | 狀態 |
|------|------|------|
| 分析匯出 API：`GET /api/analytics/export?format=csv&days=30`（趨勢、解決率） | API | ✅ |
| 分析頁已有 CSV/PDF 按鈕 | 沿用 | ✅ |
| 選做：自訂維度、簡易儀表板編輯 | 依資源 | 待做 |

### 3.3 WhatsApp / Messenger / Instagram

| 任務 | 交付 | 狀態 |
|------|------|------|
| 整合說明文件、所需 API/成本/合規 | docs | 待做 |
| 設定頁佔位「即將推出」+ Webhook 預留 | UI | 待做 |

---

## 實作順序建議

1. **Sprint A（基礎）**：內部備註、Ticketing 欄位、AI 品質標記與納入知識庫、API Key 表與管理。
2. **Sprint B**：聯絡表單進 Inbox、PDF 匯入、Campaigns LINE 發送、白標設定。
3. **Sprint C**：路由規則、自動化範本、Status Page、分析匯出。
4. **Sprint D**：Email 收發、進階分析、多管道佔位與文件。

本文件與 `docs/CRISP_FEATURE_PARITY.md` 對齊，完成一項即可在兩份文件中更新狀態。
