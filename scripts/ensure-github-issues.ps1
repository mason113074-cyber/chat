# Create GitHub issues for mason113074-cyber/chat (skip if title exists)
$ErrorActionPreference = "Stop"
$REPO = "mason113074-cyber/chat"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "找不到 gh（GitHub CLI）。請先安裝：https://cli.github.com/"
  exit 1
}

Write-Host "gh version: $((gh --version 2>&1) | Select-Object -First 1)"
$ErrorActionPreference = "Continue"
$authResult = gh auth status 2>&1
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0 -or "$authResult" -match "not logged") { Write-Host "請先執行: gh auth login"; exit 1 }
gh repo set-default $REPO 2>&1 | Out-Null

$tmp = New-TemporaryFile
Remove-Item $tmp -Force
New-Item -ItemType Directory -Path $tmp | Out-Null

function Ensure-Issue {
  param([string]$Title, [string]$Label = "", [string]$Body)
  $bodyFile = Join-Path $tmp "body_$([Guid]::NewGuid().ToString('N').Substring(0,8)).md"
  [System.IO.File]::WriteAllText($bodyFile, $Body, (New-Object System.Text.UTF8Encoding $false))

  $existing = gh issue list --repo $REPO --search "${Title} in:title" --state all --json number --jq ".[0].number" 2>$null
  if ($existing -and $existing -ne "null") {
    Write-Host "Skip：已存在 Issue #$existing — $Title"
    return
  }

  if ($Label) {
    gh issue create --repo $REPO --title $Title --body-file $bodyFile --label $Label --assignee "@me"
  } else {
    gh issue create --repo $REPO --title $Title --body-file $bodyFile --assignee "@me"
  }
  Write-Host "Created: $Title"
}

# Issue 1
Ensure-Issue -Title "[P1][CI] 新增 GitHub Actions CI + Dependabot（PR 必須綠燈）" -Label "enhancement" -Body @'
## 背景
目前 repo 沒有 GitHub Actions（無 `.github/workflows`），缺乏自動化 lint/type-check/test/build 的防線。

## 目標
在 PR / push main 時自動跑最低限度的品質檢查，避免回歸與安全事故。

## 工作項目
- [ ] 新增 `.github/workflows/ci.yml`
  - [ ] trigger：`pull_request`（main）、`push`（main）
  - [ ] node：使用 LTS（建議 20）+ cache
  - [ ] `npm ci`
  - [ ] `npm run type-check`
  - [ ] `npm run lint`
  - [ ] `npm run test:unit:run`
  - [ ] `npm run build`
- [ ] 新增 `.github/dependabot.yml`
  - [ ] npm weekly
- [ ]（可選）Playwright E2E：
  - [ ] PR 不跑（避免慢），改成 scheduled nightly 或只在 main 手動跑

## 驗收標準
- [ ] 任一 PR 會自動出現 CI checks
- [ ] 乾淨 checkout 下 `npm ci` 後上述指令皆可跑完
- [ ] CI 失敗能阻擋 merge（branch protection 由 repo 設定完成）
'@

# Issue 2
Ensure-Issue -Title "[P1][DX] 對齊 Next.js 16 與 eslint-config-next 版本" -Label "enhancement" -Body @'
## 背景
目前 Next.js 版本與 eslint-config-next 版本不一致（Next 16 + eslint-config-next 14），容易造成 lint 規則/行為不一致與 CI 不穩定。

## 目標
對齊 Next.js 與 eslint-config-next 的相容版本，讓 lint 行為穩定可預期。

## 工作項目
- [ ] 方案擇一（建議 A）：
  - [ ] A) 升級 `eslint-config-next` 到與 Next 16 相容版本
  - [ ] B) 或將 Next 固定回 14（若你有相容性需求）
- [ ] `npm run lint` 必須通過
- [ ] `npm run build` 必須通過
- [ ] 若有新增/變動規則，補上最小必要的 eslint 設定說明（README 或 docs）

## 驗收標準
- [ ] 乾淨安裝後 `npm run lint` 0 error
- [ ] `npm run build` 0 error
'@

# Issue 3
Ensure-Issue -Title "[P1][DB] ai_suggestions：forward-only 相容 migration（兼容舊 draft_text/pending）" -Label "bug" -Body @'
## 背景
ai_suggestions 曾存在舊 schema（draft_text / status pending/approved/sent），目前 repo 以 multibot schema（suggested_reply / status draft/sent/expired/rejected + bot_id/event_id...）為準。
新環境不會再執行舊版 .bak，但「舊資料庫」可能仍停留在舊欄位，導致 API select/insert 新欄位失敗。

## 目標
新增一個 forward-only migration：在不破壞既有資料前提下，把舊 ai_suggestions 升級到 multibot schema 最低可用集合。

## 工作項目
- [ ] 新增 migration：`supabase/migrations/030_ai_suggestions_forward_compat.sql`
- [ ] migration 必須「可重複執行」且安全：
  - [ ] 若 `suggested_reply` 不存在但 `draft_text` 存在：新增 `suggested_reply` 並 copy data
  - [ ] 若缺少 `bot_id/event_id/user_message/sources_count/confidence_score/risk_category/expires_at` 等欄位：以 nullable / default 補齊
  - [ ] status mapping：pending/approved -> draft；sent -> sent
  - [ ] 不 drop 舊欄位（保留 draft_text 等，避免資料遺失）
- [ ] 補齊 index / constraint（必要者）
- [ ] RLS policy 以現行 multibot policy 為準

## 驗收標準
- [ ] 在「舊 schema ai_suggestions」的資料庫上跑完 migration 後：API 可正常查詢與插入
- [ ] 在「新 schema」資料庫上跑 migration 不會改壞既有資料
'@

# Issue 4
Ensure-Issue -Title "[P1][SEC] webhook_events 留存/清理策略（retention + cron purge）" -Label "enhancement" -Body @'
## 背景
webhook_events 會保存 raw_body（原始 webhook payload）。這包含客戶訊息，無留存策略會造成資料庫膨脹與隱私/合規風險。

## 目標
建立可控的 retention 與自動清理機制（cron），同時不影響 webhook 正常處理。

## 建議留存（可調）
- processed：保留 7 天
- failed：保留 30 天
- pending：保留 1 天

## 工作項目
- [ ] 新增 cron route：`/api/cron/cleanup-webhook-events`（service role + WEBHOOK_CLEANUP_CRON_SECRET）
- [ ] 更新 `vercel.json` 加入 cron（例如每日一次）
- [ ] 更新 docs：說明 retention 與如何手動觸發清理

## 驗收標準
- [ ] 手動呼叫 cron route 可刪除符合條件的 records；未帶 secret 時回 401/403
- [ ] 不影響正常 webhook（LINE）處理
'@

# Issue 5
Ensure-Issue -Title "[P1][Policy] 退款/退錢：改走 SUGGEST/ASK（不 AUTO）而非直接封死" -Label "enhancement" -Body @'
## 背景
目前敏感詞偵測（非 low）會直接走固定回覆並 return。「退款/退錢」是高風險但高頻問題：完全封死會讓客服效率變差。

## 目標
退款/退錢類訊息：不允許 AUTO；允許產生 SUGGEST 草稿（安全模板/ASK 欄位），讓人工一鍵送出。

## 工作項目
- [ ] 調整 webhook 的敏感詞分支：將「退款/退錢」從 hard-stop 改為走決策層 -> SUGGEST/ASK
- [ ] 草稿內容使用安全模板；若缺訂單編號先 ASK；仍保留其他高風險 hard-stop
- [ ] 新增/更新單元測試

## 驗收標準
- [ ] 測試訊息「我要退款，訂單 123」會產生 ai_suggestions status=draft，回 ack 話術
- [ ] 不會直接回覆承諾語
'@

# Issue 6
Ensure-Issue -Title "[P2][Docs] 更新文件：multi-bot production 要求 + legacy webhook 410" -Label "documentation" -Body @'
## 背景
目前文件仍描述 Upstash 為選用、legacy webhook 仍可用。實際已導入：multi-bot production 強制 Upstash；legacy /api/webhook/line 在 production 預設 410。

## 目標
讓 README / docs / .env.example 與實作一致。

## 工作項目
- [ ] 更新 docs：INTEGRATION_STATUS、DEPLOYMENT_AND_ENV_FAQ、README（Webhook URL 以 /api/webhook/line/{botId}/{webhookKey} 為主）
- [ ] 確認 .env.example 已包含 LINE_WEBHOOK_LEGACY_ENABLED 註解、WEBHOOK_CLEANUP_CRON_SECRET（若實作 retention）
- [ ] 增補「Production verification checklist」

## 驗收標準
- [ ] 新人照 README + docs 設定一次就能跑起來；文件明確寫出 multi-bot webhook 正確 URL 與必要 env
'@

Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
Write-Host "Done. 請到 GitHub Issues 頁確認是否都已建立完成。"
