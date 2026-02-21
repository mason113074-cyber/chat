# Knowledge Graph Memory — 高優先級上下文

> **⚠️ 高優先級上下文 (HIGH PRIORITY CONTEXT)**  
> 與 `memory-bank.md` 同為架構與規則之權威來源。相關開發前**請先讀取**，**禁止覆蓋或破壞既有架構設定**。

---

## 節點與關係總覽

```
[Product] CustomerAIPro
  ├─ 部署於 → [Vercel]
  ├─ 使用 → [Next.js 16] [Supabase] [OpenAI]
  └─ 租戶模型 → 一 user 一租戶 (users.id = auth.users.id)

[Supabase]
  ├─ 提供 → [PostgreSQL] [Auth] [RLS]
  ├─ 規則 → 所有 API 先驗證 session；敏感操作用 SERVICE_ROLE
  └─ Migration → supabase/migrations/ 編號自 010 延續

[RLS 原則]
  ├─ 僅做「列屬於該 user」隔離
  ├─ 不做「是否超量」判斷（屬應用層）
  └─ 新表必須 ENABLE ROW LEVEL SECURITY + policy(auth.uid() = user_id 或等價)

[計費權限]
  ├─ 有效方案來源 → subscriptions 表（唯一真相）
  ├─ 無有效訂閱 → 視為 free
  ├─ 用量上限 → lib/plans.ts PLAN_LIMITS
  ├─ 檢查時機 → 應用層（API/service），非 RLS
  └─ 超限行為 → 拒絕請求 (403)，不先執行再標記

[表 → RLS 綁定]
  users          → auth.uid() = id
  contacts       → auth.uid() = user_id
  conversations  → via contact_id → contacts.user_id = auth.uid()
  orders         → via contact_id → contacts.user_id = auth.uid()
  subscriptions  → auth.uid() = user_id
  payments       → auth.uid() = user_id
  knowledge_base → auth.uid() = user_id
  contact_tags   → auth.uid() = user_id
  contact_tag_assignments → via contact_id → contacts.user_id = auth.uid()
  openai_usage   → auth.uid() = user_id (SELECT only)
  ai_feedback    → auth.uid() = user_id（AI 滿意度回饋，待 migration）
  workflows      → auth.uid() = user_id（自動化工作流程，ReactFlow nodes/edges）
  workflow_logs  → via workflow_id → workflows.user_id = auth.uid()
```

[AI 回覆加強 — 高優先級]
  ├─ 設定來源 → users.ai_reply_config (jsonb)
  ├─ 滿意度 → ai_feedback 表（待建）
  ├─ 整合點 → /api/chat, /api/webhook/line, /api/settings
  ├─ Guidance → guidance_style, guidance_forbidden, guidance_escalation 併入 system prompt
  └─ 不可破壞 → 既有 system_prompt, ai_model, quick_replies 欄位

---

## 依賴版本（與 memory-bank 一致）

- **next** ^16.1.6
- **@supabase/ssr** ^0.8.0, **@supabase/supabase-js** ^2.45.0
- **next-intl** ^4.8.3, **openai** ^4.67.0, **@line/bot-sdk** ^9.4.0
- **@upstash/redis** ^1.36.2（選用）
- **typescript** ^5.6.2, **@playwright/test** ^1.58.2, **vitest** ^2.1.6

---

## 關鍵約束（不可破壞）

1. **RLS**：不得為業務表新增「全表可讀」或「忽略 auth.uid()」的 policy。
2. **方案**：有效方案僅由 `subscriptions` + 當前週期決定；`lib/plans.ts` 與 DB plans 的 limits 須對齊。
3. **權限**：用量/方案檢查只在應用層；不在 DB trigger 或 RLS 內實作 limit 邏輯。
4. **認證**：前端僅用 anon key；service role 僅 server 端、且僅在需跨租戶/系統操作時使用。
5. **AI 回覆加強**：`users.ai_reply_config` 為擴展點；不可覆蓋既有 `system_prompt`、`ai_model`、`quick_replies`；`ai_feedback` 表須 RLS `auth.uid() = user_id`。

---

*與 memory-bank.md 同步維護；多租戶/計費/AI 回覆相關開發前請先讀取兩份文件。*
