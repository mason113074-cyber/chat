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
- [ ] 8. POST /api/webhook/line → production 預期 **410**（若 `LINE_WEBHOOK_LEGACY_ENABLED=true` 則走簽章驗證）
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

## 三、Production 環境設定確認清單

### Upstash Redis 驗證

- [ ] Vercel 後台確認 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN` 已設定（multi-bot production 必填）
- [ ] 部署後發送 LINE 訊息，在 Vercel Functions log **不應**出現 `[LINE webhook] Upstash Redis is not configured` 警告
- [ ] 快速連發同一訊息 2 次 → Vercel log 出現 `Duplicate event skipped + botId` → 只處理 1 次（驗證跨 instance 冪等）

### Legacy Webhook 410 驗證

- [ ] 確認 `LINE_WEBHOOK_LEGACY_ENABLED` **未設定**（或為空）
- [ ] 執行以下指令，預期回傳 HTTP 410：
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST https://www.customeraipro.com/api/webhook/line \
    -H "Content-Type: application/json" -d '{}'
  # 預期輸出：410
  ```
- [ ] 若需短期重新啟用，設定 `LINE_WEBHOOK_LEGACY_ENABLED=true` 並重新部署，確認 POST 不再回 410

### Cron 驗證

- [ ] 確認 `HEALTHCHECK_CRON_SECRET` 已在 Vercel 後台設定
- [ ] 在 Vercel 後台 → Logs → Cron Triggers 確認 `/api/health-check` 每 15 分鐘有觸發記錄
- [ ] 手動呼叫確認健康檢查正常：
  ```bash
  curl -H "Authorization: Bearer $HEALTHCHECK_CRON_SECRET" \
    https://www.customeraipro.com/api/health-check
  # 預期回傳 200 + 健康狀態 JSON
  ```

### Multi-bot Webhook 驗證

- [ ] 在 Settings → Bots 取得 `botId` 與 `webhookKey`
- [ ] 確認 LINE Developers Console Webhook URL 格式為 `/api/webhook/line/{botId}/{webhookKey}`
- [ ] 發送測試訊息確認正確 bot 的 channel access token 回覆（Vercel log 顯示對應 botId）

---

## 四、Rollback 計畫

- **proxy 誤擋 API**：rollback 到前一個 commit，或縮小 matcher 範圍
- **webhook 回覆失敗**：先把 reply_delay 設回 0，檢查 credentials / LINE API error
- **知識庫搜尋異常**：暫時把 `MAX_KNOWLEDGE_ROWS` 改回 50 以排除問題
