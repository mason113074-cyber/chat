# CustomerAI Pro — 現狀盤點報告

**產出日期**：2026-02  
**範圍**：Repo 全面盤點，僅新增本報告檔；未修改任何既有程式或 schema。

---

## Executive Summary

- **專案**：CustomerAI Pro（AI 智能客服 SaaS），Next.js 16 + Supabase + LINE + OpenAI，正式網址 https://www.customeraipro.com，部署於 Vercel。
- **目前分支**：`fix/knowledge-search-cjk-tokenizer` 與 `main` 並存；主線為 `main`（Merge PR #16 fix/ai-suggestions-schema-and-audit）。
- **已完成核心**：LINE Webhook（單 bot + 多 bot 路由）、AI Copilot 決策層（AUTO/SUGGEST/ASK/HANDOFF）、知識庫 RAG（含 CJK tokenizer 分支）、Suggestions 草稿→送出流程、Guardrail 敏感詞、工作流程引擎（Automations）、Dashboard（對話/聯絡人/知識庫/設定/數據/活動/帳單等）。
- **⚠️ ai_suggestions 有兩份 migration 衝突**：`029_ai_copilot_suggestions.sql`（draft_text、status pending/approved/sent）與 `029_multibot_copilot.sql`（suggested_reply、status draft/sent/expired/rejected、bot_id/event_id/sent_by）。程式與 API 實際使用 **029_multibot_copilot** 欄位；若 DB 曾先跑 029_ai_copilot_suggestions，可能缺欄或狀態值不一致，需以「不破壞既有資料」方式收斂為單一 schema。
- **⚠️ WorkflowEngine 使用全域 LINE client**：`lib/workflow-engine.ts` 內 `replyMessage(ctx.replyToken, msg)` 未傳入 credentials；由多 bot webhook 觸發工作流程時，回覆會走 `process.env.LINE_*` 而非該 bot 的加密憑證，多租戶/多 bot 情境下可能回錯頻道。
- **前端草稿 UI**：對話詳情頁 `app/[locale]/dashboard/conversations/[contactId]/page.tsx` 已串接 `/api/conversations/[id]/suggestions`，顯示 `draft_text`（API 對應 `suggested_reply`）與一鍵送出；無獨立的「Suggestions 草稿區」頁面。Settings 有 `/api/settings/bots`，但 **Settings 多 bot 管理 UI 未確認是否完整**（API 存在，前端需再確認）。
- **測試**：Vitest 單元（reply-decision、knowledge-search-tokenize、StatusBadge、StatCard、TestDashboard）、Playwright E2E（auth、smoke、checklist、crisp-p1-p2、automations、full-flow-production 等）；缺口：webhook 整合測試、多 bot 路徑、Guardrail 邊界。
- **環境變數**：Supabase（URL、anon、service_role）、OpenAI、LINE（channel、Login）、選用 Redis/ LemonSqueezy/ 健康檢查/ 加密/ 告警；多 bot 需 `LINE_BOT_ENCRYPTION_KEY`。
- **建議優先**：(1) 收斂 ai_suggestions 為單一 migration 定義並補齊欄位；(2) WorkflowEngine 支援傳入 credentials；(3) 確認 production 已部署 CJK tokenizer 並驗收 DoD1/DoD2（或調整 guardrail 使退錢流程可出 draft）。

---

## 1. Git 與環境基礎（摘要）

| 項目 | 結果摘要 |
|------|----------|
| `git status` | 分支 fix/knowledge-search-cjk-tokenizer；modified: .gitignore；untracked: 部分 .cursor、docs/REPORTS、testsprite_tests |
| `git log --oneline -n 30` | 021126f test(rag) tokenization → 594306e Merge PR #16 → 0baddf5/bd31e30 fix(audit) → 171dcce/2511fb9 fix suggestions → b37085c Merge PR #15 → 5207747 Merge PR #14 Ai 副駕 … |
| `git branch -vv` | main、fix/knowledge-search-cjk-tokenizer、fix/ai-suggestions-schema-and-audit、fix/typecheck-audit-e2e、b1/event-queue-multibot、cursor/ai-4fdf、docs/audit-reports 等 |
| `git remote -v` | origin https://github.com/mason113074-cyber/chat.git (fetch/push) |

---

## 2. 專案結構總覽

```
app/
  [locale]/dashboard/     # 儀表板：conversations, contacts, knowledge-base, settings, analytics, billing, campaigns, automations, onboarding, ai-quality, system-test
  api/                    # 所有 API 路由（見下表）
lib/
  ai/                     # 決策層 reply-decision、分類與門檻
  security/               # 敏感詞 detectSensitiveKeywords、output-filter
  line.ts                 # LINE client（支援注入 credentials）
  encrypt.ts              # AES-256-GCM 加密、webhook key hash
  knowledge-search.ts     # RAG + CJK tokenizer（分支）
  workflow-engine.ts      # 自動化流程執行（reply 用全域 LINE）
  supabase.ts             # createClient、getSupabaseAdmin
docs/
  AI_COPILOT_POLICY.md    # 產品層 AI 副駕規則
  REPORTS/                # 各次 release 稽核報告
  ...                     # 其他說明與 runbook
supabase/migrations/      # 001～029（含兩份 029，見下）
.cursor/rules/            # ai-copilot-policy.mdc（alwaysApply: true）等
memory-bank/              # 專案脈絡、tasks、progress、archive
components/               # dashboard 共用元件、automations FlowEditor、Toast、EmptyState 等
e2e/                      # Playwright 規格（auth、smoke、checklist、crisp-p1-p2、automations、full-flow-production 等）
```

---

## 3. 技術棧版本確認

| 套件 | 版本 |
|------|------|
| Next.js | ^16.1.6 |
| React | ^18.3.1 |
| TypeScript | ^5.6.2 |
| @supabase/supabase-js | ^2.45.0 |
| @supabase/ssr | ^0.8.0 |
| openai | ^4.67.0 |
| @line/bot-sdk | ^9.4.0 |
| next-intl | ^4.8.3 |
| @upstash/redis | ^1.36.2 |
| @xyflow/react | ^12.10.1 |

**npm scripts**：dev, build, start, lint, type-check, check-all, test (playwright), test:api, test:unit, test:unit:run, test:ui, test:e2e:chromium, test:e2e:prod, test:demo, check-e2e-supabase, check-connections 等。

---

## 4. 資料庫 Migration 盤點

### 4.1 Migrations 清單（按編號）

| 檔案 | 用途摘要 |
|------|----------|
| 001_phase1_schema.sql | users, contacts, conversations, orders, subscriptions + RLS |
| 002_add_system_prompt.sql | 系統提示相關 |
| 003_add_conversation_tags.sql | 對話標籤 |
| 004_add_ai_model.sql | AI 模型欄位 |
| 005_add_contacts_status.sql | contacts.status pending/resolved |
| 006_billing_phase1.sql | 帳單相關 |
| 007_add_onboarding_fields.sql |  onboarding 欄位 |
| 008_create_knowledge_base.sql | 知識庫表 |
| 009_add_conversation_status.sql | 對話狀態 |
| 010_create_contact_tags.sql | 聯絡人標籤 |
| 011_add_quick_replies.sql | 快速回覆 |
| 012_create_openai_usage.sql | OpenAI 使用量 |
| 013_index_performance.sql | 效能索引 |
| 014_db_monitoring_functions.sql | 監控函數 |
| 015_get_dashboard_stats.sql | 儀表板統計 |
| 016_supabase_fix_and_optimize.sql | knowledge_base, contact_tags, contact_tag_assignments, contacts.status 等 |
| 017_advisor_fixes.sql | plans RLS |
| 018_health_check_logs.sql | 健康檢查日誌 |
| 019_health_check_logs_rls_cron.sql | 健康檢查 RLS/cron |
| 020_plans_pricing_update.sql | 方案定價 |
| 021_plans_sync_names_yearly.sql | 方案名稱 |
| 022_line_login_binding.sql | LINE 登入綁定 |
| 023_ai_reply_sprint1_4.sql | AI 回覆相關 |
| 024_ai_reply_sprint5_12.sql | ai_guidance_rules, ai_feedback, ab_tests |
| 025_contacts_crm_fields.sql | 聯絡人 CRM 欄位 |
| 026_workflow_automation.sql | workflows, workflow_logs |
| 027_crisp_crm_and_mvp_tables.sql | customer_events, segments, health_scores, message_sentiments, campaigns, campaign_logs 等 |
| 028_crisp_p1_p2_schema.sql | conversation_notes, ticketing, api_keys, routing_rules, branding, ai_feedback 擴充 |
| 029_ai_copilot_suggestions.sql | ⚠️ ai_suggestions（第一版：draft_text, pending/approved/sent） |
| 029_multibot_copilot.sql | line_bots, webhook_events, ai_suggestions（第二版：suggested_reply, draft/sent, bot_id, event_id, sent_by） |

### 4.2 ⚠️ ai_suggestions 衝突判定

| 項目 | 029_ai_copilot_suggestions.sql | 029_multibot_copilot.sql |
|------|-------------------------------|---------------------------|
| 草稿內容欄位 | `draft_text` | `suggested_reply` |
| 狀態列舉 | `pending`, `approved`, `sent` | `draft`, `sent`, `expired`, `rejected` |
| 其他 | source_message_id, action, category, confidence, reason, sources, approved_by, approved_at | bot_id, event_id, user_message, sources_count, confidence_score, risk_category, sent_by, expires_at |

**程式實際使用**：  
- `app/api/webhook/line/route.ts` insert：suggested_reply, status: 'draft', bot_id, event_id, sent_at, sent_by 等 → **029_multibot 版**。  
- `app/api/suggestions/[id]/send/route.ts`、`app/api/conversations/[id]/suggestions/route.ts`：讀寫 suggested_reply、status 'draft'/'sent'。  
- 前端 `conversations/[contactId]/page.tsx` 型別為 draft_text，API 層將 `suggested_reply` 映射為 `draft_text` 回傳。

**結論**：應用層與 API 皆依 **029_multibot_copilot** 的 schema。若 DB 曾只執行 029_ai_copilot_suggestions，會缺欄或狀態不符；若兩檔都跑過，後跑的 029_multibot 會用 `CREATE TABLE IF NOT EXISTS` 與既有表並存，實際欄位以 DB 當前為準（通常為後者覆蓋或混合，需查 DB 實際欄位）。

**建議（不破壞既有資料）**：  
1) 僅保留一套定義：以 029_multibot_copilot 為準，將 029_ai_copilot_suggestions 更名為備援（例如 `029_ai_copilot_suggestions_deprecated.sql`）或移除其中 ai_suggestions 定義，避免新環境重跑時再建出舊表。  
2) 若 production 已存在舊版（draft_text）：新增一筆 **forward-only** migration，對 ai_suggestions 做 ALTER 補齊 suggested_reply（可從 draft_text 複製）、bot_id/event_id/sent_by 等（可設 default/NULL），並將 status 從 pending/approved/sent 對應到 draft/sent，不 drop 既有資料。

### 4.3 主要 Tables Schema 摘要

| Table | 摘要 |
|-------|------|
| users | id(auth), email, plan, line_channel_id, branding 等 |
| contacts | user_id, line_user_id, name, tags, status, ticket 等 |
| conversations | contact_id, message, role, status, resolved_by 等 |
| knowledge_base | user_id, title, content, category, is_active |
| ai_suggestions | 以 029_multibot 為準：contact_id, user_id, bot_id, event_id, user_message, suggested_reply, status(draft/sent/…), sent_at, sent_by, expires_at |
| line_bots | user_id, name, webhook_key_hash, encrypted_channel_secret, encrypted_channel_access_token, is_active |
| webhook_events | bot_id, raw_body, status(pending/processed/failed), processed_at |
| workflows / workflow_logs | 工作流程定義與執行紀錄 |

### 4.4 RLS Policies 清單（摘要）

- **ai_suggestions**：029_multibot 使用 "Users manage own ai_suggestions via contact"（auth.uid() = user_id 且 contact 屬於該 user）。  
- **line_bots**：Users manage own line_bots。  
- **webhook_events**：Service role only（USING false，僅 service role 可寫讀）。  
- **knowledge_base, contacts, conversations, users**：依序為 manage own、manage own contacts、依設計、read/update own。  
- 其餘表多為 `auth.uid() = user_id` 或透過關聯表限制。

---

## 5. API 端點盤點

| 路徑 | Method | 功能 | Auth | 讀寫 Tables | 風險點 |
|------|--------|------|------|-------------|--------|
| /api/webhook/line | POST | 單 bot LINE webhook | 簽章驗證 | conversations, contacts, ai_suggestions, webhook_events 等 | 使用 service role 寫入；idempotency 有 |
| /api/webhook/line/[botId]/[webhookKey] | POST | 多 bot webhook | botId + webhookKey 驗簽、解密密鑰 | line_bots, webhook_events, 同上 | 同上；解密失敗 500 |
| /api/conversations/[id]/suggestions | GET | 取得建議草稿 | Cookie/session | ai_suggestions | status 對應 draft→pending 映射 |
| /api/conversations/[id]/suggestions/[suggestionId] | GET | 單筆建議 | 同上 | ai_suggestions | - |
| /api/suggestions/[id]/send | POST | 一鍵送出草稿 | 同上 | ai_suggestions, conversations | 冪等：status≠draft 拒送 |
| /api/contacts/[id]/suggestions | GET | 聯絡人維度草稿 | 同上 | ai_suggestions | - |
| /api/conversations/[id]/reply | POST | 手動回覆（可綁建議） | 同上 | conversations, ai_suggestions | - |
| /api/settings/bots | GET/POST | 多 bot 列表/新增 | 同上 | line_bots | 寫入時加密需 LINE_BOT_ENCRYPTION_KEY |
| /api/settings | GET/POST | 使用者設定 | 同上 | users 等 | - |
| /api/knowledge-base/* | 多種 | 知識庫 CRUD、搜尋、匯入、測試 | 同上 | knowledge_base | - |
| /api/chat | POST | 聊天（非 webhook） | 同上 | conversations, 知識庫 | - |
| /api/workflows/[id]/execute | POST | 手動執行工作流程 | 同上 | workflow_logs, conversations, contacts | ⚠️ 使用全域 LINE 發送 |
| /api/health-check, /api/health/* | GET | 健康檢查 | 部分 cron secret | 讀取各服務 | 不暴露內部細節 |
| 其餘 | - | analytics, billing, onboarding, campaigns, contacts, tags… | 多為 session | 各對應表 | 依 RLS |

---

## 6. AI Copilot 決策層盤點

- **docs/AI_COPILOT_POLICY.md**：禁止 AI 承諾退款/折扣/賠償/價格/到貨；三段式 SUGGEST / AUTO_SAFE / ASK / HANDOFF；模板優先類別（退款、退換貨、折扣…）；必填欄位不足先 ASK；草稿與決策需可稽核。
- **.cursor/rules/ai-copilot-policy.mdc**：alwaysApply: true；高風險永不 AUTO；sourcesCount=0 且非簡單問題不可硬答；confidence < threshold 僅 SUGGEST/ASK；人工送出須更新 sent/sent_at。
- **lib/ai/reply-decision.ts**：分類（classifyReplyCategory）、缺欄位（buildClarifyingQuestions）、信心（calculateHeuristicConfidence）、決策（decideReplyAction）；高風險類別永不 AUTO；sourcesCount=0 且非簡單→ASK/HANDOFF；confidence 不足→SUGGEST/ASK；缺必要欄位→ASK。
- **lib/ai/__tests__/reply-decision.test.ts**：5 案—高風險不 AUTO、無 sources 且非簡單→ASK/HANDOFF、低風險有 sources 高信心→AUTO、信心低→SUGGEST/ASK、退款模板缺訂單編號→ASK 且 askText 含訂單編號。

---

## 7. LINE Webhook 與多 Bot 盤點

- **app/api/webhook/line/route.ts**：驗簽 → 解析 events → 依 event 取得/建立 contact → 可選走 Workflow 觸發 → 敏感詞 guardrail → KB 搜尋 → decideReplyAction → AUTO 直回 / SUGGEST 寫 ai_suggestions + ack / ASK 或 HANDOFF 固定話術；idempotency 以 eventId+botId 為準；支援 overrides（ownerUserId, credentials, botId）供多 bot 路由呼叫。
- **app/api/webhook/line/[botId]/[webhookKey]/route.ts**：查 line_bots → 驗 webhook_key_hash → 解密 channel secret/token → 寫 webhook_events → 呼叫 handleEvent(..., overrides) 傳入 credentials。
- **lib/encrypt.ts**：AES-256-GCM；KEY 來自 LINE_BOT_ENCRYPTION_KEY（32+ 字元或 64 hex）；hashWebhookKey 為 SHA-256 hex。
- **WorkflowEngine 觸發時 LINE client**：`lib/workflow-engine.ts` 內 replyMessage(ctx.replyToken, ...) **未傳入 credentials**，使用 `getLineClient()` 預設值 → **process.env.LINE_CHANNEL_***。多 bot webhook 觸發流程時，回覆會走全域 env，非該 bot 憑證。⚠️ 風險見下。

---

## 8. 前端頁面 + 元件盤點

| 頁面路徑 | 功能 | 實際 UI / 空殼 | 呼叫 API |
|----------|------|----------------|----------|
| dashboard/conversations | 對話列表 | 實際列表、狀態篩選 | conversations/counts, contacts |
| dashboard/conversations/[contactId] | 對話詳情 + 建議草稿 | 實際；草稿區、一鍵送出 | conversations/[id]/suggestions, suggestions/[id]/send, contacts, notes |
| dashboard/contacts | 聯絡人 | 實際 | contacts, tags |
| dashboard/knowledge-base | 知識庫 | 實際 | knowledge-base/* |
| dashboard/settings | 設定 | 實際（整合多區塊） | settings, settings/line, settings/bots, settings/preview… |
| dashboard/analytics | 數據 | 實際 | analytics/* |
| dashboard/billing | 帳單 | 實際 | billing/usage |
| dashboard/campaigns, campaigns/new, [id] | 活動 | 實際 | campaigns |
| dashboard/automations, automations/[id] | 工作流程 | 實際 FlowEditor | workflows |
| dashboard/onboarding, ai-quality, system-test | 引導/品質/測試 | 實際 | 各對應 |

- **對話詳情頁**：✅ 已串接 ai_suggestions 草稿（GET suggestions?status=pending，顯示 draft_text，一鍵送出 POST suggestions/[id]/send）。  
- **Suggestions 草稿區**：❌ 無獨立頁面；草稿僅在對話詳情頁內。  
- **Settings 多 bot 管理 UI**：API GET/POST /api/settings/bots 存在；前端是否完整（列表/新增/編輯/刪除）**未逐檔確認**，僅確認 API 與 encrypt 使用正確。

**關鍵元件**：FlowEditor（automations）、StatusBadge/StatCard/TrendChart、Toast、EmptyState、LocaleSwitcher、GlobalSearch、TestDashboard 等。

---

## 9. 測試覆蓋率

| 類型 | 位置 | 覆蓋範圍 |
|------|------|----------|
| 單元 | lib/ai/__tests__/reply-decision.test.ts | decideReplyAction 5 案 |
| 單元 | lib/__tests__/knowledge-search-tokenize.test.ts | tokenizeQuery CJK/同義/英文 |
| 單元 | components/dashboard/shared/__tests__/StatusBadge.test.tsx, StatCard.test.tsx | 元件 |
| 單元 | components/dashboard/test-dashboard/__tests__/*.tsx | TestDashboard、a11y |
| E2E | e2e/*.spec.ts | auth, smoke, checklist, crisp-p1-p2, automations, dashboard-sidebar, full-flow-production, line-login-binding 等 |

**跑法**：`npm run test:unit:run`（Vitest）、`npm run test` / `npm run test:ui`（Playwright）、`npm run test:e2e:prod`（production 基底）。

**缺口**：webhook 整合測試（含多 bot）、guardrail 邊界、reply-decision 與 KB 整合、WorkflowEngine 含 LINE 的 E2E。

---

## 10. 環境變數需求（.env.example）

| 分類 | 變數 | 用途 |
|------|------|------|
| Supabase | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | 連線與 RLS  bypass（後端） |
| OpenAI | OPENAI_API_KEY, OPENAI_TIMEOUT_MS, OPENAI_MAX_RETRIES | 聊天與工作流程 |
| LINE | LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LINE_OWNER_USER_ID | 單 bot webhook / 全域 reply |
| LINE Login | LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET | 登入/綁定 |
| 多 Bot 加密 | LINE_BOT_ENCRYPTION_KEY | AES-256-GCM 加密 line_bots 憑證 |
| Redis | UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | 選用；快取/冪等 |
| LemonSqueezy | LEMONSQUEEZY_* | 選用付款 |
| 健康檢查 | HEALTHCHECK_CRON_SECRET | Cron 觸發 |
| 安全性 | SECURITY_STRICT_MODE, SECURITY_OUTPUT_FILTER_TIMEOUT | 輸出過濾 |
| 告警 | DISCORD_WEBHOOK_URL, SLACK_WEBHOOK_URL | 選用 |
| E2E | TEST_BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD | 勿提交 |

**不輸出任何實際 secret 值。**

### 狀態標註摘要

| 項目 | 狀態 |
|------|------|
| LINE 單 bot / 多 bot webhook | ✅ |
| AI 決策層 AUTO/SUGGEST/ASK/HANDOFF | ✅ |
| ai_suggestions 草稿→送出、防雙發 | ✅ |
| 對話詳情頁串接草稿 UI | ✅ |
| 獨立 Suggestions 草稿區頁面 | ❌ |
| ai_suggestions 雙 migration 收斂 | ⚠️ 未收斂 |
| WorkflowEngine 多 bot 憑證傳遞 | ⚠️ 使用全域 LINE |
| Settings 多 bot 管理 UI 完整度 | 未確認（API 存在） |
| Guardrail 先於 KB 導致無 draft | ⚠️ 已知限制 |

---

## 11. 風險清單（P0/P1/P2）

| 級別 | 項目 | 影響 | 重現/場景 | 建議修法 |
|------|------|------|-----------|----------|
| P0 | ai_suggestions 兩份 migration | 新環境或重跑可能建出舊表/欄位不一致；production 若為舊版會缺 suggested_reply/bot_id 等 | 依序執行兩份 029 | 收斂為單一 schema；forward-only migration 補欄與狀態對應 |
| P0 | WorkflowEngine 使用全域 LINE | 多 bot webhook 觸發流程時，回覆發到預設 channel 而非該 bot | 多 bot 註冊 → 用 bot A webhook 觸發流程 → 回覆由 env 的 bot 發出 | ExecutionContext 增加可選 credentials；replyMessage 傳入 credentials；webhook 呼叫 execute 時傳入 overrides.credentials |
| P1 | 前端草稿 UI 與 API 欄位映射 | 若 DB 仍為 draft_text 舊版，API 回傳會錯 | 僅在 DB 為舊 schema 時 | 確保 DB 已遷移至 multibot schema；或 API 同時支援 draft_text 讀取 |
| P1 | Guardrail 先於 KB/決策 | 含「退錢」等詞直接回敏感句，sourcesCount 未參與、無 draft | 使用者發「我想退錢，訂單 123…」 | 調整順序或條件：先 KB+決策，再 guardrail；或放寬「退錢+訂單+流程」為非敏感路徑 |
| P2 | hardcoded secrets | 若存在會洩漏 | 搜尋 repo | 僅使用 env；.env* 已 gitignore |
| P2 | TypeScript any 濫用 | 型別不安全 | 局部 | 關鍵路徑補型別、漸進收斂 |
| P2 | TODO/FIXME/HACK | 技術債 | lib/security/output-filter（儲存 security_logs）、lib/analytics-cache（avgResponseTime, topIssues） | 排期實作或註記追蹤 |
| P2 | RLS 覆蓋完整性 | 漏 policy 會跨租戶 | 逐表檢查 | 新表上線前檢查 RLS；webhook_events 維持 service only |
| P2 | 未使用的 dependencies | 肥大、安全更新負擔 | package.json | 定期 audit、移除未用套件 |

---

## 12. 結論與建議

### MVP 完成度評估：**約 78%**

- 核心：LINE 單/多 bot、決策層、RAG、草稿→送出、guardrail、工作流程、Dashboard 已具備。  
- 未完成/待收斂：ai_suggestions 單一 schema、Workflow 多 bot 正確發送、Guardrail 與 KB 順序/條件、Settings 多 bot UI 完整度、部分 E2E/整合測試。

### 最優先三件事

1. **收斂 ai_suggestions 為單一 migration 定義**，並視 production 現況做 forward-only 遷移（補欄、狀態對應）。  
2. **WorkflowEngine 支援傳入 LINE credentials**，webhook 呼叫 execute 時傳入該 bot 憑證，避免回錯頻道。  
3. **確認 production 部署 CJK tokenizer** 並驗收 DoD1/DoD2（或調整 guardrail），使「退錢+訂單+流程」可產 draft 且一鍵送出與防雙發正常。

### 下一個 2 週 Sprint 建議（可開 Issue）

| 標題 | Acceptance Criteria |
|------|---------------------|
| [DB] 收斂 ai_suggestions migration 並提供 forward-only 遷移 | 僅保留一份 029 定義；新環境建表一致；既有環境可無損升級至 suggested_reply/draft/sent 等欄位與狀態 |
| [Backend] WorkflowEngine 支援依 context 使用 LINE credentials | ExecutionContext 可選帶 credentials；replyMessage 使用該 credentials；webhook 傳入 overrides.credentials |
| [Policy] Guardrail 與 KB 順序或退錢流程例外 | 退錢+訂單+流程 可走 KB+SUGGEST 並產 draft；或文件明確標註現行「先 guardrail」為設計取捨 |
| [E2E] 多 bot webhook 路徑與建議送出 E2E | 可選：新增 e2e 覆蓋 [botId]/[webhookKey] 與 suggestions send 冪等 |
| [Docs] Settings 多 bot UI 對應 API 清單與操作步驟 | 確認前端是否完整呼叫 GET/POST bots；缺則補或標註為後續迭代 |

### 專案上下文摘要（約 500 字，可貼給其他 AI）

CustomerAI Pro 為 AI 智能客服 SaaS，技術棧 Next.js 16、Supabase（Auth + PostgreSQL + RLS）、LINE Messaging API、OpenAI。正式站為 https://www.customeraipro.com，部署於 Vercel。  
產品規則：AI 僅能當副駕，禁止自動承諾退款/折扣/價格/到貨等；決策層為 AUTO（低風險+有 KB+高信心）、SUGGEST（草稿待人工）、ASK（缺欄位澄清）、HANDOFF（轉人工）。  
實作上：LINE webhook 有單一（/api/webhook/line）與多 bot（/api/webhook/line/[botId]/[webhookKey]）；多 bot 憑證存於 line_bots 表並以 AES-256-GCM 加密，webhook 驗簽後解密並傳入 handleEvent overrides。  
知識庫 RAG 在 lib/knowledge-search.ts，分支 fix/knowledge-search-cjk-tokenizer 已加入 CJK 2/3-gram 與退錢→退款同義詞，提升中文命中率。  
Suggestions 流程：webhook 在 action=SUGGEST 時寫入 ai_suggestions（suggested_reply、status draft），前端對話詳情頁呼叫 GET /api/conversations/[id]/suggestions 與 POST /api/suggestions/[id]/send 做一鍵送出與防雙發。  
目前已知問題：supabase/migrations 內有兩份 029（029_ai_copilot_suggestions 與 029_multibot_copilot）定義 ai_suggestions，欄位與狀態列舉不同；程式與 API 皆依 029_multibot_copilot。另 WorkflowEngine 在發送 LINE 回覆時未接收 credentials，由多 bot 觸發時會使用全域 env 的 channel。  
測試：Vitest（reply-decision、knowledge-search-tokenize、部分 UI）、Playwright E2E（auth、smoke、checklist、automations、full-flow-production 等）。環境變數見 .env.example；多 bot 需 LINE_BOT_ENCRYPTION_KEY，不得將真實 secret 寫入程式或報告。

---

## 附錄：實際執行過的指令清單

```
git status
git log --oneline -n 30
git branch -vv
git remote -v
```

（其餘為讀檔、grep、glob 等，未執行會寫入 secret 的指令。）
