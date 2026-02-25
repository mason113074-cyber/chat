# PR body for chore/github-hardening-20250224

Create the PR manually at: **https://github.com/mason113074-cyber/chat/compare/main...chore/github-hardening-20250224**

Paste the following as the PR description:

---

## Summary

This PR implements **Phase 0–3** of the GitHub repo hardening audit: CI stability, Dependabot policy, security workflows, and repo governance docs. No new npm packages; no product logic changes.

### Phase 1 — P0

- **CI (`.github/workflows/ci.yml`)**  
  - Concurrency (cancel in-progress runs for same ref).  
  - Job timeout 15 min.  
  - Job-level dummy env so CI runs without real secrets (no `OPENAI_API_KEY` from GitHub Secrets).  
  - `workflow_dispatch` for manual run.  
  - Pipeline unchanged: `npm ci` → type-check → lint → test:unit:run → build.

- **Dependabot (`.github/dependabot.yml`)**  
  - `open-pull-requests-limit: 5`.  
  - Labels: `dependencies`.  
  - Ignore **major** for: `eslint`, `eslint-config-next`, `@types/node`, `cross-env` (avoid noisy/breaking PRs).

- **Dependency Review (`.github/workflows/dependency-review.yml`)**  
  - On `pull_request` to `main`; uses `actions/dependency-review-action@v4`; fail on high severity.

- **CodeQL (`.github/workflows/codeql.yml`)**  
  - `javascript-typescript`; push/PR to `main` + weekly schedule.

### Phase 2 — Repo standardization

- **CODEOWNERS**: `* @mason113074-cyber`.
- **PR template**: What/Why, how to test, risk, DB migration Y/N, env change Y/N, scope.
- **Issue templates**: `bug_report.md`, `feature_request.md`.
- **SECURITY.md**: How to report vulnerabilities.
- **CONTRIBUTING.md**: Branch naming, PR flow, how to run tests, commit message (UTF-8).
- **docs/GITHUB_REPO_SETTINGS_CHECKLIST.md**: Checklist for **GitHub UI** (branch protection, merge strategy, security toggles).

### Phase 3 — Hygiene

- **docs/COMMIT_CONVENTION.md**: UTF-8, no garbled commits; prefer Squash merge.
- **docs/BRANCH_CLEANUP_PLAN.md**: Remote branch types and suggested cleanup process (no auto-delete).
- **docs/AUDIT_GITHUB.md**: Baseline scan results + list of changes in this PR + suggested handling of open Dependabot PRs.

### What you need to do in the GitHub UI (after merge)

See **docs/GITHUB_REPO_SETTINGS_CHECKLIST.md**. Short list:

1. **Branches** → protect `main` → require PR + status checks (CI, optionally Dependency Review, CodeQL) + no force push + include administrators.
2. **General** → Pull Requests → enable **Squash merge** (and set as default if desired).
3. **Security** → enable Dependabot alerts + security updates; enable Secret scanning + Push protection if available.

### Suggested handling of current Open Dependabot PRs

- **Major updates** (eslint, @types/node, cross-env): **Close or postpone**; this repo now ignores major for these in `dependabot.yml`.
- **Minor/patch**: Review and merge as usual (or let Dependabot group them; limit 5).

### Verification

- `npm ci` / `npm run type-check` / `npm run lint` / `npm run test:unit:run` / `npm run build` (with dummy env) all passed locally.
