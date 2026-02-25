# Security Policy

## Supported Versions

We release updates for the **main** branch. Production deploys from **main** via Vercel.

| Branch / Environment | Supported          |
|----------------------|--------------------|
| main (production)    | ✅ Yes             |
| Preview / PR builds  | Best-effort        |
| Legacy / archived    | ❌ No              |

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. **Email** or contact the maintainers privately (use the contact method listed on [CustomerAIPro](https://www.customeraipro.com) if available).
3. Include:
   - Description of the vulnerability and impact
   - Steps to reproduce (if possible)
   - Suggested fix or mitigation (optional)
4. We will acknowledge receipt and aim to respond within a reasonable time. We may ask for clarification.
5. After the issue is fixed, we may publish a brief advisory (e.g. in release notes or a security advisory) without disclosing details that could enable exploitation.

We do not offer a bug bounty at this time; we appreciate responsible disclosure.

## Security Practices in This Repo

- **Secrets**: Never commit `.env`, `.env.local`, or any file containing API keys, tokens, or passwords. Use `.env.example` as a template only.
- **Auth**: Supabase Auth + RLS; API routes protected by proxy layer; LINE webhook validated by signature and per-bot credentials.
- **Dependencies**: We run `npm audit` and GitHub Dependency Review on PRs; high-severity issues should be addressed before merge.
- **Deploy**: Production URL is https://www.customeraipro.com; all callbacks and redirects use `NEXT_PUBLIC_APP_URL` / `getAppUrl()`.

## Updates and Dependency Strategy

- We update dependencies via Dependabot or manual PRs; major upgrades (e.g. Next.js, React) are tested on preview before merging to main.
- Security-related patches are prioritized; we aim to apply critical fixes in a timely manner.

---

*Last updated: 2026-02. For product or account security, see the terms and privacy pages on the website.*
