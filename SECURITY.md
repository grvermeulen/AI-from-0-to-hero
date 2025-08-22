# Security

- Validate inputs with Zod
- Use secure, httpOnly cookies; SameSite=lax (strict where possible)
- Rate limit public POST endpoints (login, signup, AI endpoints)
- Store secrets in CI/CD provider; never commit

## CSRF

- Strategy: same-origin checks using `Sec-Fetch-Site`, `Origin`/`Referer` verification, with optional double-submit cookie (`csrf`) + header (`x-csrf-token`).
- Applied to: signup and AI evaluate endpoints; allow in test environment for stability.

## Rate limiting

- In-memory, IP-scoped buckets for single-instance mode.
- Applied to: login (`/api/auth/[...nextauth]`), signup, AI suggest (sync/stream), AI evaluate (command/code).
- Follow-up: Redis-backed limiter for multi-instance deployments.

## Session cookies

- NextAuth session cookie set to httpOnly, SameSite=lax, secure in production, `__Host-` prefix when available.

## Health checks

- `/api/health` includes DB connectivity flag.


