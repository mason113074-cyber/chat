# Commit Convention

To keep history readable and avoid garbled commits, follow these rules.

---

## Encoding and language

- **Use UTF-8** for all commit messages and code. Ensure your Git and terminal use UTF-8 (e.g. `git config core.quotepath false` can help with display).
- Prefer **English** or clear **Traditional Chinese**. Avoid mixed or broken characters (e.g. from wrong encoding or copy-paste from Word).

---

## Message format

- **Format**: `type: short description`
- **Types**: `Fix`, `feat`, `chore`, `Docs`, `Refactor`, `Test`, etc.
- **Example**: `Fix: knowledge search CJK tokenization`, `chore: harden GitHub workflows and dependabot`

---

## Squash merge and PR title

- This repo recommends **Squash merge** for PRs (see `docs/GITHUB_REPO_SETTINGS_CHECKLIST.md`).
- The **PR title** becomes the **single commit message** on `main`. So:
  - Keep the PR title clear and in the same format: `type: short description`.
  - Avoid very long or noisy commit histories from many small commits; the squash will collapse them into one.

---

## What to avoid

- Do **not** commit with a terminal/editor that is not set to UTF-8 if you use non-ASCII characters (you may get mojibake in history).
- Do **not** paste text from tools that might inject special or invisible characters.
- Do **not** force-push to `main`; use PRs and let branch protection enforce checks.
