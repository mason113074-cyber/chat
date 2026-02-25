# Contributing to CustomerAIPro (chat)

Thank you for your interest in contributing. This document covers branch naming, PR flow, and how to run tests.

## Branch naming

- Use a short prefix and description: `fix/description`, `feat/description`, `chore/description`, `docs/description`.
- Examples: `fix/knowledge-search-cjk`, `feat/add-campaigns-api`, `chore/github-hardening-20250224`.

## Pull Request flow

1. Create a branch from `main`: `git checkout main && git pull origin main && git checkout -b your-branch`.
2. Make changes. Ensure all tests and lint pass locally (see below).
3. Push your branch and open a PR against `main`.
4. Fill in the PR template (what/why, how to test, risk, DB or env changes, scope).
5. Wait for CI (type-check, lint, unit tests, build) and any required reviews. Resolve any feedback.
6. Prefer **Squash merge** so the PR title becomes the main commit message on `main` (see repo settings).

## Running tests locally

From the repo root:

```bash
npm ci
npm run type-check
npm run lint
npm run test:unit:run
npm run build
```

- **E2E (Playwright)** is optional and not required for most PRs: `npm run test` (requires env and optional services).
- CI does **not** run E2E by default to keep pipeline fast.

## Commit messages

- Use **UTF-8** encoding. Avoid garbled characters (e.g. from wrong terminal encoding).
- Prefer **English** or clear **Traditional Chinese**.
- Format: `type: short description` — e.g. `Fix: xxx`, `feat: xxx`, `chore: xxx`, `Docs: xxx`.
- If your repo uses Squash merge, the PR title will be the main commit message; keep it clear and concise.

## Code style

- TypeScript strict mode; no `any` without justification.
- Follow existing patterns and the project's ESLint configuration.
- New API routes and UI should align with the existing structure (see `.cursor/rules` and `docs/` if present).

## Questions

Open a discussion or issue if you have questions about the codebase or contribution process.
