# GitHub Repo Settings Checklist

These settings **cannot** be changed by code in the repo; they must be configured in the GitHub UI. Use this checklist after merging the governance/CI PR.

---

## A) Branch protection (main)

**Path**: Repo → **Settings** → **Branches** → **Add branch protection rule** (or edit existing for `main`).

- [ ] **Branch name pattern**: `main`
- [ ] **Require a pull request before merging**
  - [ ] Require approvals: 0 or 1 (your choice)
  - [ ] Dismiss stale pull request approvals when new commits are pushed (optional)
- [ ] **Require status checks to pass before merging**
  - [ ] Require branches to be up to date before merging
  - [ ] Status checks to require: **CI** (the workflow name from `.github/workflows/ci.yml`)
  - [ ] If you add Dependency Review and CodeQL workflows, add: **Dependency Review**, **CodeQL** (or the job names shown in the PR checks)
- [ ] **Include administrators** — so that even admins must satisfy the rule
- [ ] **Do not allow bypassing the above settings** (if available)
- [ ] **Restrict who can push to matching branches** (optional): only allow specific people/teams
- [ ] **Disable force push** (recommended)
- [ ] **Allow force push** — leave **unchecked** for `main`
- [ ] **Allow deletions** — leave **unchecked** for `main`

Save with **Create** or **Save changes**.

---

## B) Merge strategy

**Path**: Repo → **Settings** → **General** → scroll to **Pull Requests**.

- [ ] **Allow merge commits** — optional (can disable to keep history linear)
- [ ] **Allow squash merging** — **enable** (recommended so PR title becomes the single commit message; reduces noisy history and avoids garbled commits from bad merges)
- [ ] **Allow rebase merging** — optional
- [ ] **Default to squash merge** — **enable** if you want new PRs to default to squash

---

## C) Security (Repo Settings → Security)

**Path**: Repo → **Settings** → **Code security and analysis** (or **Security**).

- [ ] **Dependabot alerts** — **Enabled** (alerts for vulnerable dependencies)
- [ ] **Dependabot security updates** — **Enabled** (allows Dependabot to open PRs for security fixes)
- [ ] **Secret scanning** — **Enabled** if available for your plan (scans for leaked secrets)
- [ ] **Push protection** (for secret scanning) — **Enabled** if you want to block pushes that contain known secrets

**Workflow-related (optional):**

- **Dependency Review** (`.github/workflows/dependency-review.yml`) requires **Dependency graph** to be enabled. If it is off, the workflow will skip with a notice and will not block the PR. Enable **Dependency graph** in Code security and analysis to run the check.
- **CodeQL** (`.github/workflows/codeql.yml`) requires **Code scanning** / **Advanced Security** (private repos may need a plan that includes GHAS). If unavailable, the workflow will skip with a notice and will not block the PR. Enable Code scanning in Settings to run this check.

---

## D) Optional: PR / Issue defaults

- **PR template**: Already in repo (`.github/pull_request_template.md`). It will auto-fill when opening a new PR.
- **Issue templates**: Already in repo (`.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`). Users can choose when creating an issue.

---

## Summary (short list)

1. **Branches** → protect `main` → require PR + status checks (CI, optionally Dependency Review, CodeQL) + no force push + include administrators.
2. **General** → Pull Requests → enable **Squash merge** (and set as default if desired).
3. **Security** → enable **Dependabot alerts** and **security updates**; enable **Secret scanning** and **Push protection** if available.

After this, only PRs that pass CI (and any other required checks) can be merged into `main`, and merge history stays clean with squash.
