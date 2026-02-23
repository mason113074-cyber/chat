# Release Audit Report — fix/ai-suggestions-schema-and-audit

**日期**：2026-02-22  
**範圍**：分支 fix/ai-suggestions-schema-and-audit 上線至 production，並完成三條 DoD 驗收。

---

## A) PR 與合併

| 項目 | 值 |
|------|-----|
| **Compare link** | https://github.com/mason113074-cyber/chat/compare/main...fix/ai-suggestions-schema-and-audit?expand=1 |
| **Merge commit SHA** | *(合併後填寫)* |
| **PR 標題** | Fix: ai_suggestions insert schema + guardrail audit logging |
| **PR 描述** | 見下方「PR 描述（貼 GitHub 用）」 |

### PR 描述（貼 GitHub 用）

- **Fix ai_suggestions insert**: use `suggested_reply` (align with DB schema), keep draft status, map sources_count/confidence/risk fields if present.
- **Fix guardrail audit**: sensitive-branch now persists user+assistant records into conversations with `resolved_by='guardrail'` (idempotent).
- Verified: lint/build/type-check pass.

---

## B) Production 部署確認（Vercel）

**查詢時間**：list_deployments(projectId: chat-l27v, teamId: mason4)。  
**目前最新 target=production 的 deployment**：

| 項目 | 值 |
|------|-----|
| **Deployment URL** | https://chat-l27v-kayfb65c1-mason4.vercel.app |
| **githubCommitMessage** | Merge pull request #15 from mason113074-cyber/fix/typecheck-audit-e2e — Fix/typecheck audit e2e |
| **githubCommitSha** | b37085ca503b2a7607c2fb549ad7f948b0f1df60 |
| **state** | READY |
| **created** | 1771769490010 (epoch ms) |

**判定**：目前 production 仍是 **PR #15** 的 main，尚未包含 fix/ai-suggestions-schema-and-audit。**請先完成 A) 建立 PR 並 merge 到 main，等 Vercel 自動部署 main 後，再查一次 list_deployments 確認 production 的 githubCommitSha 等於 merge SHA，再執行 C) 驗收。**

---

## C) Production 驗收（Supabase）

**Supabase project ref**：aqnjiyuyopyuklragaau  
**contact_id（驗收用）**：*(SQL-2 取最新一筆 id)*

### 驗收步驟與結果

1. **T3b-1 已發**：「我想退錢，訂單編號 123456，商品是 A，上週下單，請問流程怎麼走？」
   - **SQL-1 摘要（ai_suggestions 最新 10）**：*(id, status, created_at, sent_at)*
   - **DoD1**：是否出現 1 筆 status='draft'、created_at 接近現在 → PASS / FAIL

2. **已送出**（後台一鍵送出後）
   - **SQL-1 摘要（該筆）**：status / sent_at
   - **DoD2**：該筆 status='sent'、sent_at 有值；第二次送出被拒絕 → PASS / FAIL

3. **T-guardrail 已發**：「我要退款」
   - **SQL-3 摘要（conversations 最新 20，role/resolved_by/created_at/msg_head）**：
   - **DoD3**：是否見 user「我要退款」+ assistant 固定句、resolved_by='guardrail' → PASS / FAIL

---

## D) 結論

| DoD | 結果 |
|-----|------|
| DoD1：T3b-1 後 ai_suggestions 出現 draft | |
| DoD2：一鍵送出變 sent、防雙發 | |
| DoD3：敏感詞留痕 user+assistant、guardrail | |

**整體**：PASS / FAIL  

**若 FAIL**：最可能原因與下一步修法（不在此改 code）。

### 若 DoD1 失敗（ai_suggestions 仍為 0）

- **可能原因**：仍走 ASK/HANDOFF（缺欄位先澄清）、decision 未回 SUGGEST、或 insert 權限/欄位錯誤。
- **替代句（避開 HIGH_RISK_KEYWORDS、盡量命中 KB）**：  
  1. 「請問售後或保固要怎麼申請？」  
  2. 「請問你們有幾種付款方式？需要準備什麼資料？」
