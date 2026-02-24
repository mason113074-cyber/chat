# Release Audit Report — fix/knowledge-search-cjk-tokenizer

**日期**：2026-02-21  
**範圍**：分支 fix/knowledge-search-cjk-tokenizer 合併上線至 production，並重新驗收 DoD1（ai_suggestions draft）、DoD2（送出＋防雙發）。

---

## A) PR 與合併

| 項目 | 值 |
|------|-----|
| **Compare link** | https://github.com/mason113074-cyber/chat/compare/main...fix/knowledge-search-cjk-tokenizer?expand=1 |
| **PR 標題** | fix(rag): CJK n-gram + synonym normalization for knowledge search |
| **PR 描述** | Fix KB/RAG low hit-rate for CJK: add 2/3-gram tokenization + minimal synonyms (退錢/退費/退回款→退款), cap MAX_TOKENS=40, keep English behavior. Adds Vitest coverage. |
| **Merge commit SHA** | *(合併後填寫；請用 `gh pr merge --squash --delete-branch` 或 GitHub UI 合併後提供)* |

**說明**：本機 `gh` 未登入，請手動建立 PR 並合併。建立後請回填 PR 連結（/pull/xx）與 merge commit SHA。

---

## B) Production 部署確認（Vercel）

**查詢**：list_deployments(projectId: prj_04iLzkELCbteV7DZ7sBzhJ3xeRPq, teamId: team_Sknq78Yb32wqsF8DEmzW65CQ)。

**目前最新 target=production 的 deployment（合併前基準）**：

| 項目 | 值 |
|------|-----|
| **Deployment URL** | https://chat-l27v-gipadxhru-mason4.vercel.app |
| **githubCommitSha** | 594306e1955b3dcfcddcdcec63b7656d89d65d1d |
| **githubCommitMessage** | Merge pull request #16 from mason113074-cyber/fix/ai-suggestions-schema-and-audit — Fix/ai suggestions schema and audit |
| **state** | READY |
| **created** | 1771782316114 (epoch ms) |

**PASS 條件**：合併 CJK tokenizer 後，再次 list_deployments，確認出現一筆 target=production 且 githubCommitSha = 上一步 merge commit（或對應之 main 上的 commit）。

---

## C) Production 冒煙（DoD1：ai_suggestions draft）

**Supabase project ref**：aqnjiyuyopyuklragaau  

**contact_id（驗收用）**：`bf61fed0-b03a-417f-bc31-115f7f591492`（created_at 最新一筆）。

### 請使用者在 LINE 發送的句子

- **T1（建議先發）**：  
  「我想退錢，訂單編號 123456，商品是 A，購買日期 2/20，原因尺寸不合，請問流程怎麼走？」

- **T2（若 T1 仍無 draft 再發）**：  
  「退錢流程：訂單 123456，商品 A，2/20 下單，想了解處理流程與所需資料」

### 查詢摘要（不含 message 全文）

- **SQL-1**：`select id, status, created_at, sent_at, contact_id from ai_suggestions order by created_at desc limit 10;`
- **SQL-2**：`select role, resolved_by, created_at, left(message,80) as msg_head from conversations where contact_id = 'bf61fed0-b03a-417f-bc31-115f7f591492' order by created_at desc limit 12;`

**DoD1 PASS**：發完 T1（或 T2）後，SQL-1 出現 1 筆 status='draft'、created_at 接近現在。

---

## D) 若 ai_suggestions 仍為 0（DoD1 FAIL）— 定位原因

**D1 — KB 命中數（已執行）**：

```sql
select count(*) as hit from knowledge_base
where content ilike '%退款%' or content ilike '%退錢%' or content ilike '%退費%'
  or content ilike '%退回款%' or content ilike '%退貨%';
```

**結果**：**hit = 0**（目前 KB 沒有任何退款/退錢/退費/退貨相關內容。）

**結論**：KB 根本沒有退款相關內容 → 再好的 tokenization 也無法讓 sourcesCount >= 1。

**下一步（必做）**：  
請在後台新增一筆「臨時 KB」供測通用（測完可刪）：

- **標題**：退錢流程測試  
- **內容**（務必同時出現：退錢、退款、流程、訂單）：  
  退錢/退款流程、需要資料（訂單編號、商品、日期、原因）、處理時程、例外情況。

新增後請再發一次 T1，並重跑 SQL-1 / SQL-2。

**D3 — 若 hit > 0 仍無 draft**：最可能原因 (1) decideReplyAction 仍回 ASK/HANDOFF（missingRequiredFields 仍為 true）；(2) sourcesCount 仍為 0（搜尋/權重問題）。可改發更完整欄位版 T1b：「我想退錢，訂單編號 123456，商品 A，購買日期 2/20，原因尺寸不合，付款方式信用卡，請問流程怎麼走？」

---

## E) DoD2：送出 ＋ 防雙發

1. 回覆使用者 **draft_id**。
2. 請使用者到後台按「一鍵送出」後回報「已送出」。
3. 查詢：`select id, status, sent_at, sent_by from ai_suggestions where id='<draft_id>';`  
   **PASS**：status='sent' 且 sent_at 有值。
4. 請使用者對同一筆再按一次送出 → 回報「第二次已按」。再查同一 SQL，確認 status/sent_at 未被改寫、第二次被拒絕或冪等（400/已送出均可）。

---

## F) 結論與對帳

| 項目 | 值 |
|------|-----|
| **PR 連結** | *(合併後填寫，例如 /pull/17)* |
| **Merge SHA** | *(合併後填寫)* |
| **Production deploy SHA** | *(合併且 Vercel 部署後填寫)* |

| DoD | 結果 |
|-----|------|
| DoD1：T1/T2 後 ai_suggestions 出現 draft | *(驗收後填 PASS/FAIL)* |
| DoD2：一鍵送出 → sent；防雙發成立 | *(驗收後填 PASS/FAIL)* |

**整體**：PASS / FAIL  

**若 FAIL**：卡點與下一步（例如：KB 補內容、決策條件調整）寫於下方。

- **當前卡點**：KB hit=0 → 必須先新增「退錢流程測試」臨時 KB，再測 T1/T2 與 DoD1。

**2026-02-21 更新**：已插入臨時 KB（title: 退錢流程測試（可刪）），hit count = 1。待 tokenizer 合併並部署至 production 後，用 T1 冒煙驗收 DoD1/DoD2。
