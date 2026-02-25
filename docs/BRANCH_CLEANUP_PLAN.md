# Branch Cleanup Plan

This document lists remote branch types in the repo and suggests which branches can be safely deleted **after** you have confirmed they are merged or obsolete. **Do not delete branches from this repo programmatically**; use the GitHub UI or your own process.

---

## Remote branch types (as of audit)

- **main** — default branch; do not delete.
- **copilot/**\* — branches created by Copilot or automation (e.g. `copilot/add-github-actions-ci`, `copilot/add-webhook-events-retention`, `copilot/update-docs-multi-bot-prod`). Many of these have already been merged via PRs; the branch names remain until deleted.
- **dependabot/**\* — Dependabot update branches (e.g. `dependabot/npm_and_yarn/cross-env-10.1.0`, `dependabot/npm_and_yarn/eslint-10.0.2`, `dependabot/npm_and_yarn/types/node-25.3.0`). Delete after the corresponding PR is merged or closed.
- **fix/**\* — fix branches (e.g. `fix/p0-security-workflow`, `fix/ai-suggestions-schema-and-audit`). Delete if the PR was merged or the fix is abandoned.
- **docs/**\* — e.g. `docs/audit-reports`. Delete if merged.
- **b1/**\* — e.g. `b1/event-queue-multibot`. Delete if merged.
- **cursor/**\* — e.g. `cursor/ai-4fdf`, `cursor/unspecified-task-processing-96ac`. Delete if merged or no longer needed.
- **remove-dashboard-openai** — delete if merged or obsolete.

---

## Suggested process

1. **Merged PRs**: In GitHub, go to **Pull requests** → **Closed**. For each merged PR, use “Delete branch” on the PR page (or delete the remote branch from **Branches**).
2. **Closed PRs (not merged)**: The branch can still be deleted to reduce clutter; the PR and commit history remain. Delete from **Branches** if you are sure you will not reopen.
3. **Dependabot PRs**: After closing or merging a Dependabot PR, delete the associated `dependabot/npm_and_yarn/...` branch from **Branches**.
4. **Stale branches**: If a branch is clearly obsolete (e.g. superseded by another PR or by work on `main`), delete it after confirmation. Prefer doing this in the GitHub UI so you can double-check.

---

## What not to do

- Do **not** run scripts that delete remote branches without checking merge status.
- Do **not** delete `main` or the default branch.
- If in doubt, leave the branch; you can delete it later.

This plan is for maintenance only; no automated deletion is performed from this repo.
