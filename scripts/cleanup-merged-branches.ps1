# Cleanup merged local branches (safe: only deletes branches merged into main).
# Run from repo root. Prune remote refs after: git remote prune origin
# Usage: .\scripts\cleanup-merged-branches.ps1
#        .\scripts\cleanup-merged-branches.ps1 -Force  # 略過確認直接刪除

param([switch]$Force)

$ErrorActionPreference = 'Stop'
git fetch origin
git checkout main
if ($LASTEXITCODE -ne 0) {
  Write-Error "Cannot switch to main: you have uncommitted changes. Commit or stash them, then run this script again."
  exit 1
}
git pull origin main

$merged = git branch --merged main | ForEach-Object { $_.Trim() } | Where-Object {
  $_ -ne '' -and $_ -ne 'main' -and $_ -notmatch '^\*'
}

if ($merged.Count -eq 0) {
  Write-Host "No merged branches to delete."
  exit 0
}

Write-Host "Merged branches (will delete): $($merged -join ', ')"
if (-not $Force) {
  $confirm = Read-Host "Delete these $($merged.Count) branches? (y/N)"
  if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Aborted."
    exit 0
  }
} else {
  Write-Host "Deleting $($merged.Count) branches (-Force)."
}

foreach ($b in $merged) {
  git branch -d $b
}
Write-Host "Done. Run: git remote prune origin"
