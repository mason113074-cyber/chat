# GitHub Repo Audit — CustomerAIPro (chat)

**Audit date**: 2025-02-24  
**Repo**: mason113074-cyber/chat  
**Default branch**: main

---

## Phase 0 — Baseline scan results

### 0.1–0.2 Working directory and main sync

- Working directory: repo root `c:\dev\saas\chat` (or equivalent)
- `git checkout main` + `git pull origin main`: **OK** (already on main, up to date)

### 0.3 Command outputs (recorded at audit time)

**git status** (at scan time):
```
On branch main
Your branch is up to date with 'origin/main'.
Changes not staged: docs/INTEGRATIONS_AND_MCP.md
Untracked: docs/MCP.md, scripts/close-prs-35-37-42.ps1
```

**git remote -v**:
```
origin  https://github.com/mason113074-cyber/chat.git (fetch)
origin  https://github.com/mason113074-cyber/chat.git (push)
```

**git branch -a** (remote branches):
- main
- copilot/* (add-forward-only-migration, add-github-actions-ci, add-realtime-updates-conversations, add-skeleton-loading-error-boundary, add-webhook-events-retention, align-nextjs-eslint-config, create-issues-in-repo, fix-n-plus-one-query-issue, put-pr-in-issue, update-docs-multi-bot-prod, update-refund-request-handling, upgrade-ai-settings-page, upgrade-dashboard-layout-sidebar, upgrade-landing-page-ui, upgrade-landing-page-ui-again)
- cursor/ai-4fdf, cursor/unspecified-task-processing-96ac
- dependabot/npm_and_yarn/cross-env-10.1.0, eslint-10.0.2, types/node-25.3.0, multi-*
- docs/audit-reports
- fix/* (ai-suggestions-schema-and-audit, knowledge-search-cjk-tokenizer, p0-security-workflow, typecheck-audit-e2e)
- b1/event-queue-multibot
- remove-dashboard-openai

**.github/**:
- `.github/workflows/ci.yml` — present
- `.github/dependabot.yml` — present
- No CODEOWNERS, no ISSUE_TEMPLATE, no pull_request_template.md at scan time

**npm ci**: **PASS** (warnings: deprecated packages; 13 vulnerabilities reported by audit — not fixed in this chore)

**npm run type-check**: **PASS**

**npm run lint**: **PASS**

**npm run test:unit:run**: **PASS** (34 tests, 10 files)

**npm run build**: **PASS** (with dummy env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, NEXT_TELEMETRY_DISABLED=1)

### 0.4 PR/branches audit (for report only; no branch deletion)

**Open PRs** (to be checked in GitHub UI at audit time):
- Dependabot PRs likely present: **cross-env** (e.g. 10.x = major), **eslint** (e.g. 10.x = major), **@types/node** (e.g. 25.x = major).
- **Recommendation**: Close or postpone **major** Dependabot PRs (eslint, @types/node, cross-env) until explicitly planned; keep minor/patch or merge after review. See Dependabot policy in this PR (ignore major for these).

**Branch cleanup**: See `docs/BRANCH_CLEANUP_PLAN.md`. Many `copilot/*` and `fix/*` branches may be merged or stale; suggest deleting merged branches from GitHub UI after confirmation.

---

## Changes made in this audit (chore/github-hardening)

### Phase 1 — P0

1. **.github/workflows/ci.yml**
   - Added `concurrency` (cancel in progress for same branch).
   - Added job `timeout-minutes: 15`.
   - Kept `permissions: contents: read`.
   - Injected job-level dummy env so CI does not require real secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, NEXT_PUBLIC_APP_URL (or SITE_URL), NEXT_TELEMETRY_DISABLED=1. Removed dependency on `secrets.OPENAI_API_KEY`.
   - Added `workflow_dispatch` for manual run.
   - Pipeline unchanged: npm ci → type-check → lint → test:unit:run → build.

2. **.github/dependabot.yml**
   - `open-pull-requests-limit: 5`.
   - Groups: prod (dependencies), dev (devDependencies); minor/patch only (no major by default).
   - Ignore major for: eslint, @types/node, cross-env (and optionally others that often break the repo).
   - Labels: e.g. `dependencies`. Optional: assignees/reviewers.
   - Schedule: weekly.

3. **.github/workflows/dependency-review.yml** (new)
   - Triggers on `pull_request` to default branch.
   - Uses `actions/dependency-review-action@v4` to fail PRs that introduce known vulnerable dependencies.

4. **.github/workflows/codeql.yml** (new)
   - Language: javascript-typescript.
   - Triggers: push to main, pull_request to main, schedule (weekly).
   - Uses `github/codeql-action` standard template.

### Phase 2 — Repo standardization

5. **.github/CODEOWNERS** — `* @mason113074-cyber`.

6. **.github/pull_request_template.md** — What/Why, how to test, risk/rollback, DB migration Y/N, env change Y/N, scope (frontend/backend/DB/CI/docs).

7. **.github/ISSUE_TEMPLATE/bug_report.md**, **feature_request.md** — Short usable templates.

8. **SECURITY.md** — How to report vulnerabilities.

9. **CONTRIBUTING.md** — Branch naming, PR flow, how to run tests, commit message (UTF-8, prefer English or clear Traditional Chinese).

10. **docs/GITHUB_REPO_SETTINGS_CHECKLIST.md** — Checklist for GitHub UI: branch protection, merge strategy (squash), Dependabot alerts, secret scanning.

### Phase 3 — Hygiene

11. **docs/COMMIT_CONVENTION.md** — UTF-8 only; no garbled commits; prefer Squash merge so PR title becomes main commit message.

12. **docs/BRANCH_CLEANUP_PLAN.md** — Lists remote branch types (copilot/*, dependabot/*, fix/*); suggests which can be deleted after merge; process via GitHub UI.

---

## Suggested handling of current Open PRs

- **Dependabot major (eslint / @types/node / cross-env)**: Close or postpone; repo now ignores major for these in dependabot.yml.
- **Other Dependabot minor/patch**: Review and merge as usual, or let Dependabot group them (limit 5).
- **Non-Dependabot PRs**: Apply branch protection and status checks (CI, dependency-review, CodeQL) so only green PRs merge.

---

*Report generated as part of chore/github-hardening-20250224.*
