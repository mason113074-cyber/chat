# Production 驗證清單

## 一、PR Merge 前 — Preview 環境驗證

### P0 驗證
- [ ] 1. 未登入 → POST /api/chat → 預期 401 JSON  
  `curl -X POST https://<preview>/api/chat -H "Content-Type: application/json" -d '{"message":"你好"}'`
- [ ] 2. 已登入 → POST /api/chat → 正常回覆 AI 訊息
- [ ] 3. Workflow AI 節點（sentiment/intent）→ LINE 觸發 → 回覆正常、Supabase openai_usage 有寫入（代表走 generateReply）
- [ ] 4. 多 Bot 模式（如有）→ Bot B 觸發 Workflow → 回覆走 Bot B 的 channel access token

### P1 驗證
- [ ] 5. LINE 快速連發同一訊息 2 次 → Vercel Logs 出現 "Duplicate event skipped" + botId → 只處理 1 次
- [ ] 6. 未登入 → GET /api/settings/bots → 預期 401
- [ ] 7. 未登入 → GET /api/knowledge-base → 預期 401
- [ ] 8. POST /api/webhook/line → 不是 401（可能 400 或 signature error）
- [ ] 9. GET /api/health → 預期 200 OK

### P2 驗證
- [ ] 10. 知識庫 > 50 筆 → 搜尋只存在於第 51~100 筆的關鍵字 → 預期 AI 回覆有引用（舊版搜不到）
- [ ] 11. 搜尋不存在的詞 → 走 fallback 最近 200 筆，不 crash
- [ ] 12. Settings 設 reply_delay_seconds = 10 → 發訊息 → 實際延遲 ~3 秒，Vercel Log 出現 "Reply delay clamped"
- [ ] 13. .env LINE_BOT_ENCRYPTION_KEY 格式正確 → 加密/解密正常（故意設太短 → 啟動時報明確錯誤訊息）

### 整體回歸
- [ ] 14. Landing page / 正常載入（不受 proxy 影響）
- [ ] 15. Dashboard 所有頁面正常（已登入）
- [ ] 16. 未登入訪問 /dashboard → 重導登入頁
- [ ] 17. LINE Bot 一般問答（非 workflow）正常
- [ ] 18. LINE Bot workflow 路徑正常

## 二、Merge 後 — Production 30 分鐘監控

- [ ] 19. Vercel Production 部署成功
- [ ] 20. 用真實 LINE 帳號發訊息 → 收到 AI 回覆
- [ ] 21. Vercel Functions log 無 unhandled error
- [ ] 22. 觀察 /api/chat 401 比例（外部掃描正常，已登入不應 401）
- [ ] 23. 觀察 webhook timeout / LINE 重送 → 不應異常增加
- [ ] 24. 觀察知識庫 ilike 查詢錯誤率（已 escape，但仍留意）

## 三、Rollback 計畫

- **proxy 誤擋 API**：rollback 到前一個 commit，或縮小 matcher 範圍
- **webhook 回覆失敗**：先把 reply_delay 設回 0，檢查 credentials / LINE API error
- **知識庫搜尋異常**：暫時把 `MAX_KNOWLEDGE_ROWS` 改回 50 以排除問題
