# Lessons Learned (Running Retro)

Short retro after each step in the plan. Keep it lightweight and actionable.

## Template (use for each step)
- What went well:
- What didn’t go well:
- Improvements (process/tooling):
- Action items (next step):

---

## Step: CI hardening + coverage + local guard (this step)
- What went well:
  - Added local pre-push CI gate (typecheck + Vitest CI mode); caught failures before pushing.
  - Stabilized tests (Prisma mocks, SSR React tweak), achieving green `test:ci` locally and in CI.
  - Enabled Codecov upload and badges for visibility.
- What didn’t go well:
  - CI broke on prepare due to missing `husky` and Prisma build script approval.
  - Vitest coverage plugin version mismatch caused local coverage errors.
  - SSR test was brittle to React’s server-rendered markup (comment boundaries) and classic runtime.
- Improvements (process/tooling):
  - Pin `@vitest/coverage-v8` to match Vitest major; use CI-mode tests in hooks.
  - Pin `husky@9.1.7` for CI; add `pnpm approve-builds` before Prisma generate.
  - Centralize session access (`getCurrentSession`) and mock Prisma in unit tests to avoid runtime `.prisma` issues.
- Action items (next step):
  - Add pre-commit optional lint/typecheck for changed files (fast feedback).
  - Track CI “time-to-green” and failure causes in Codecov/Actions for 1 week.
  - Gradually unskip session fallback tests with a stable mock approach.

## Metrics to watch (rolling)
- % of pushes blocked by pre-push hook (should trend down).
- CI success rate on first run for PRs.
- Mean CI duration and flake rate.

---

Add a new section above for each subsequent step in the README plan.
