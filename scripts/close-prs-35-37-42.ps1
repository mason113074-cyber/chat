$ErrorActionPreference = "Stop"
$Repo = "mason113074-cyber/chat"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "❌ 找不到 gh（GitHub CLI）。先安裝：https://cli.github.com/  或 winget install GitHub.cli"
  exit 1
}

try { gh auth status | Out-Null } catch {
  Write-Host "❌ gh 尚未登入。請先執行：gh auth login"
  exit 1
}

gh repo set-default $Repo | Out-Null

Write-Host "`n== Open PRs (before) ==" -ForegroundColor Cyan
gh pr list --repo $Repo --state open --limit 30

# --- Close broken React partial upgrades (they cannot pass alone) ---
gh pr close 35 --repo $Repo --comment "Closing: This PR upgrades react-dom to 19 without upgrading react to 19, causing peer-dependency mismatch and Vercel build failure. Reopen later as a single PR that upgrades react + react-dom together." --delete-branch
gh pr close 37 --repo $Repo --comment "Closing: This PR upgrades react to 19 without upgrading react-dom to 19, causing peer-dependency mismatch and Vercel build failure. Reopen later as a single PR that upgrades react + react-dom together." --delete-branch

# --- Close the conflicted / mixed-scope PR ---
gh pr close 42 --repo $Repo --comment "Closing: PR is not mergeable (conflicts) and mixes unrelated changes (docs claim CI/cron not included; logic change triggers unnecessary OpenAI calls). Will reintroduce as smaller clean PRs." --delete-branch

Write-Host "`n== Open PRs (after) ==" -ForegroundColor Cyan
gh pr list --repo $Repo --state open --limit 30
