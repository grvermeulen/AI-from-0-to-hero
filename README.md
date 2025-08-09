AI‑First QA Training Platform — Build Progress


- [x] 1. Scaffold Next.js 14 + Tailwind + ESLint (monorepo via pnpm workspaces)
- [x] 2. Add tRPC + Zod baseline (HTTP adapter route, sample router)
- [x] 3. Implement Auth (NextAuth credentials), RBAC guards
- [x] 4. Add Prisma models + migrations; seed minimal tracks/modules
- [x] 5. Wire public/authed/admin tRPC routers
- [ ] 6. Build Home, Catalog, Lesson, Lab Runner, Quiz, Profile screens
- [ ] 7. Add XP engine + badges + leaderboards
- [ ] 8. Integrate AI prompt widgets; ReadyAPI → Playwright template
- [ ] 9. Testing: unit/integration/e2e; Axe + Lighthouse
- [ ] 10. Observability: pino logs; healthcheck; Sentry (optional)
- [ ] 11. CI/CD with GitHub Actions + Railway; migrations on boot
- [ ] 12. Docs: ARCHITECTURE, SECURITY, ADRs; admin provisioning

Environment note: requires Node >=20 (see `.nvmrc`). If your Node is older, run `nvm install 20 && nvm use 20`.

Last updated: Steps 1–5 complete (scaffold, tRPC baseline, Auth+RBAC, Prisma schema/seed, routers). Starting Step 6: initial UI screens (Catalog, Module, Lesson).

---

# AI‑First QA Training Platform

A production‑grade, gamified online training program to upskill manual/ReadyAPI‑focused testers into AI‑assisted Quality Engineers.

> Principles: simple architecture, end‑to‑end typed (tRPC), explicit validation (Zod), secure by default (NextAuth, Prisma, RLS-by-code), observable (structured logs), testable (Jest/Vitest + Playwright), operable (Health checks, migrations on deploy).

---

## 1) Goals & Learning Vision

* **Why change**: AI shifts testing from tool‑driven execution to **engineering**: code‑centric tests, AI‑assisted generation, triage, and risk analysis.
* **Target outcomes**:

  * From *test executor* → *AI‑assisted quality engineer*.
  * Confident with one language (Java or Python; we’ll teach via TypeScript/Playwright in‑platform).
  * Able to use AI to scaffold tests, generate data, analyze logs, and integrate in CI.
* **Delivery**: Self‑paced content + guided labs + shadowing + portfolio, with **gamified** progression (XP, badges, quests, streaks, leaderboards).

---

## 2) Monorepo Structure

```
qa-training/
  apps/
    web/                       # Next.js 14 (App Router) app
      src/
        app/                   # routes (RSC + server actions)
          (public)/
            page.tsx           # Home (vision, CTA)
            catalog/           # Tracks & modules listing
            module/[slug]/     # Lessons, labs, quizzes
            lab/[id]/          # Interactive lab runner
            login/             # Admin login
            admin/             # Admin portal (protected)
            api/trpc/[trpc]/route.ts # tRPC HTTP adapter
          (auth)/
            callback/          # NextAuth callbacks
        components/            # Design system primitives
        server/                # tRPC routers, services, auth, logging
        styles/
      public/
      next.config.mjs
      tailwind.config.ts
      postcss.config.js
      package.json
    infra/                     # IaC/ops scripts (Railway CLI, seeds)
  packages/
    ui/                        # (optional) shared UI components
    config/                    # ESLint/TS/Prettier shared configs
  prisma/
    schema.prisma
    migrations/
    seed.ts
  .github/
    workflows/
      ci.yml
  .env.example
  README.md
  ARCHITECTURE.md
  SECURITY.md
  ADRs/
```

---

## 3) Domain Model (Prisma)

### Core Learning

* **User**: learner/admin accounts.
* **Track**: "Foundation", "AI‑Augmented Testing", "Integration & QE", "Advanced".
* **Module**: belongs to a Track (e.g., "Git Basics", "API Automation with Playwright").
* **Lesson**: content pages (text, code, video), includes **inline AI prompts** for code‑gen practice.
* **Lab**: hands‑on task with evaluator (unit tests, e2e scripts, or rubric + AI review).
* **Quiz**: multiple‑choice or short answers (Zod‑validated authoring).
* **Submission**: learner’s solution (code, answers), graded automatically.
* **PortfolioItem**: links to learner’s GitHub repo examples.

### Gamification

* **Badge**: earned for milestones (e.g., first PR, CI green run, 7‑day streak).
* **XPEvent**: granular XP accrual tied to actions (lesson complete, quiz 80%+, lab pass).
* **Leaderboard**: computed view over XP.
* **Streak**: daily activity tracking.

### AI Artifacts

* **AIPromptTemplate**: reusable prompt blocks (e.g., "Convert ReadyAPI suite → Playwright tests").
* **AIEvaluation**: rubric‑based evaluation metadata and LLM feedback.

### Commerce (optional; disabled by default)

* **Order**, **OrderItem**: use Stripe if you want paid certification tracks.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { ADMIN STAFF LEARNER }

enum SubmissionStatus { PENDING PASSED FAILED }

enum TrackPhase { FOUNDATION AI_AUGMENTED INTEGRATION ADVANCED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          Role     @default(LEARNER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  profile       Profile?
  submissions   Submission[]
  xpEvents      XPEvent[]
}

model Profile {
  id        String  @id @default(cuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  displayName String
  bio       String?
  githubUrl String?
}

model Track {
  id        String     @id @default(cuid())
  slug      String     @unique
  name      String
  phase     TrackPhase
  modules   Module[]
  order     Int        @default(0)
}

model Module {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id])
  summary   String?
  lessons   Lesson[]
  labs      Lab[]
  quizzes   Quiz[]
  order     Int      @default(0)
}

model Lesson {
  id        String   @id @default(cuid())
  moduleId  String
  module    Module   @relation(fields: [moduleId], references: [id])
  slug      String   @unique
  title     String
  contentMd String   // Markdown/MDX
  order     Int      @default(0)
}

model Lab {
  id        String   @id @default(cuid())
  moduleId  String
  module    Module   @relation(fields: [moduleId], references: [id])
  title     String
  description String
  graderType  String // "unit", "e2e", "rubric-ai"
  maxScore    Int    @default(100)
}

model Quiz {
  id        String   @id @default(cuid())
  moduleId  String
  module    Module   @relation(fields: [moduleId], references: [id])
  title     String
}

model Question {
  id       String  @id @default(cuid())
  quizId   String
  quiz     Quiz    @relation(fields: [quizId], references: [id])
  kind     String  // mc|short
  prompt   String
  options  String? // JSON for mc
  answer   String? // canonical
}

model Submission {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  labId     String?
  lab       Lab?     @relation(fields: [labId], references: [id])
  quizId    String?
  quiz      Quiz?    @relation(fields: [quizId], references: [id])
  repoUrl   String?
  code      String?  // snapshot or diff
  answers   String?  // JSON
  status    SubmissionStatus @default(PENDING)
  score     Int?     // 0..100
  feedback  String?
  createdAt DateTime @default(now())
}

model Badge {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  criteria  String   // description of rule
  icon      String?
}

model UserBadge {
  id      String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  badgeId String
  badge   Badge  @relation(fields: [badgeId], references: [id])
  earnedAt DateTime @default(now())
}

model XPEvent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  kind      String   // lesson_complete|quiz_pass|lab_pass|streak
  amount    Int      // XP points
  meta      Json?
  createdAt DateTime @default(now())
}

model AIPromptTemplate {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  template  String   // mustache-ish with variables
  variables String[]
}

model AIEvaluation {
  id        String   @id @default(cuid())
  submissionId String @unique
  submission Submission @relation(fields: [submissionId], references: [id])
  rubric    String   // JSON rubric
  model     String   // e.g., gpt-5o-mini
  feedback  String
  score     Int
}
```

---

## 4) API Layer (tRPC + Zod)

* **Public procedures**

  * `track.list` (pagination)
  * `module.getBySlug`
  * `lesson.get` (MDX render)
  * `quiz.start`, `quiz.submit`
  * `lab.start`, `lab.submit`
  * `leaderboard.top`
* **Authed (learner)**

  * `me.progress.get`, `me.portfolio.upsert`
* **Admin**

  * `track.upsert`, `module.upsert/delete`
  * `lesson.upsert/delete` (MDX content)
  * `quiz.upsert`, `question.upsert`
  * `lab.upsert` (grader config), `badge.upsert`
  * `user.search`, `user.promote`

Example router:

```ts
// apps/web/src/server/routers/lesson.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const lessonRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lesson.findUnique({ where: { slug: input.slug } });
    }),

  complete: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // record XP
      await ctx.db.xPEvent.create({
        data: { userId: ctx.session.user.id, kind: "lesson_complete", amount: 10 },
      });
      return { ok: true };
    }),
});
```

---

## 5) Auth & Roles

* **NextAuth (Credentials)** for Admin/Staff; **Learners** can self‑register or SSO later.
* Passwords hashed with **bcrypt**; lockout on repeated failed attempts; session via secure, httpOnly cookies.
* **RBAC** middleware around admin routes + tRPC procedures.

```ts
// apps/web/src/server/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const authOptions = {
  providers: [
    Credentials({
      name: "Email/Password",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const user = await db.user.findUnique({ where: { email: creds!.email } });
        if (!user) return null;
        const ok = await compare(creds!.password!, user.passwordHash);
        return ok ? { id: user.id, role: user.role, email: user.email } : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
};
```

---

## 6) Gamification Engine

* **XP rules** (configurable):

  * Lesson complete (10 XP), Quiz pass ≥80% (25 XP), Lab pass (40–80 XP by difficulty), 7‑day streak bonus (50 XP).
* **Badges** examples:

  * *First Commit*, *Green Build*, *Prompt Whisperer*, *CI Integrator*, *Explorer (10 labs)*.
* **Leaderboards**: weekly + all‑time, with organization filter.

---

## 7) AI Integrations

* **Pair‑programming**: embedded prompt widgets within lessons and labs. Learners can generate starter code/snippets.
* **ReadyAPI → Framework converter**: template that accepts exported ReadyAPI test (XML/YAML) and outputs Playwright/Rest Assured scaffolds.
* **AI Evaluation** (optional): rubric‑guided LLM review on submissions (style, assertions quality, negative paths).
* **Log triage**: paste CI logs; AI suggests root‑cause and missing assertions.

> Safety: model calls go through server actions; inputs validated, PII stripped. Store only metadata + feedback, not full raw prompts unless consented.

---

## 8) Frontend UX

* **Design language**: bold blocks, playful shapes (Tailwind tokens), accessible contrast, RSC‑first.
* **Key screens**:

  * **Home**: vision, how it works, tracks preview, CTA.
  * **Track → Module → Lesson** drilldown with progress ticks.
  * **Lab Runner**: split‑pane (instructions, editor pane or repo link, submit), inline AI prompt.
  * **Quiz**: keyboard‑friendly, autosave.
  * **Profile**: XP, badges, streak, portfolio links.
  * **Admin**: CRUD for content, badge rules, users.

---

## 9) Security & Compliance

* **Input validation** with Zod everywhere.
* **Rate‑limit** public POSTs (login, register, AI suggest) via IP+user bucket.
* **CSRF** for state‑changing endpoints.
* **Secure cookies**; SameSite=strict.
* **GDPR**: data export/delete endpoint; privacy page; opt‑in analytics only.
* **Secrets** in Railway + GitHub Actions; never commit.

---

## 10) Observability & Ops

* **Structured logs** via `pino` (server) and `console` bridges (client), request IDs.
* **Error tracking** (Sentry optional), with DSN env.
* **Health check** route `/api/health` (DB + queue if added).
* **Prisma migrate deploy** at startup; idempotent seed.

---

## 11) Testing Strategy

* **Unit**: schema validators, XP engine, badge awarding.
* **Integration**: tRPC procedures (db + auth), lab grading pipeline.
* **E2E**: Playwright — enroll, complete lesson, pass quiz, submit lab, earn badge.
* **Accessibility**: Axe checks; Lighthouse ≥95 accessibility, ≥85 performance.

---

## 12) CI/CD (GitHub Actions → Railway)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck && pnpm test
      - run: pnpm build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: RailwayApp/action@v3
        with:
          service: ${{ secrets.RAILWAY_SERVICE_ID }}
          envs: |
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            RESEND_API_KEY=${{ secrets.RESEND_API_KEY }}
            OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
            SENTRY_DSN=${{ secrets.SENTRY_DSN }}
      - name: Run migrations
        run: pnpm prisma migrate deploy
```

---

## 13) Seed Content (Tracks/Modules)

* **Foundation (2–3 months)**

  * Git Basics, Programming Fundamentals (TypeScript), Unit Testing & Assertions, HTTP & APIs.
  * **Lab**: write a small API test without AI; then refactor with AI help.
* **AI‑Augmented Testing (2–3 months)**

  * Prompt Engineering for Test Design, ReadyAPI → Code, Data Generation & Fuzzing.
  * **Lab**: convert a ReadyAPI collection to Playwright tests; add negative cases.
* **Integration & Quality Engineering (2–4 months)**

  * CI Pipelines, Test Orchestration, Log Triage with AI, Coverage Gap Suggestions.
  * **Lab**: integrate tests into CI; set up failing test → AI suggests fix.
* **Advanced (ongoing)**

  * Performance with k6/Artillery + AI scenario drafting, Risk‑based testing with AI, Exploratory testing heuristics augmented by AI.

---

## 14) Example Lesson (MDX excerpt)

````mdx
# Using AI to Generate Test Data

<Callout>Always validate generated data with schemas and invariants.</Callout>

1. Define your **Zod** schema.
2. Ask AI to produce 20 valid & 5 invalid examples.
3. Pipe invalids through your validators and assert they fail.

```ts
const UserSchema = z.object({ email: z.string().email(), age: z.number().min(18) });
````

````

---

## 15) Example Lab (Rubric + Auto‑grader)

- **Task**: Write Playwright API tests for `/login` and `/orders` with positive & negative paths; include data‑driven cases.
- **Auto‑grader**: runs `pnpm test:lab:123` inside a temp repo; score by passed tests; optional *AIEvaluation* to check assertions quality and edge‑case coverage.

```ts
// grader pseudo
const result = await runJest();
let score = Math.min(100, passed * 10);
if (enableAI) {
  const feedback = await aiReview({ code, rubric });
  score = Math.round(0.8 * score + 0.2 * feedback.score);
}
````

---

## 16) Admin Features

* Markdown/MDX authoring with preview.
* Quiz and question editors with validation.
* Badge rules editor (declarative JSON rules -> XP engine).
* CSV export of submissions; impersonate learner for support.

---

## 17) Env Vars (.env.example)

```
DATABASE_URL=
NEXTAUTH_SECRET=
RESEND_API_KEY=
OPENAI_API_KEY=
SENTRY_DSN=
SITE_URL=
```

---

## 18) Step‑by‑Step Execution Plan (Now)

1. **Scaffold** Next.js 14 + tRPC + Tailwind; strict TS; ESLint/Prettier; Husky pre‑commit.
2. **Implement** Auth (NextAuth credentials), RBAC guards.
3. **Add** Prisma models + migrations; seed tracks/modules minimal set.
4. **Wire** tRPC routers (public + authed + admin) with Zod.
5. **Build** Home, Catalog, Lesson, Lab Runner, Quiz, Profile.
6. **Add** XP engine + badges + leaderboards.
7. **Integrate** AI prompt widgets server‑side; ReadyAPI→Playwright converter template.
8. **Testing**: unit/integration/e2e; Axe + Lighthouse budgets.
9. **Observability**: pino logs; healthcheck; (opt) Sentry.
10. **CI/CD**: GitHub Actions; Railway deploy; migrations on boot.
11. **Docs**: README, ARCHITECTURE, SECURITY, ADRs; initial admin credentials provisioning.

---

## 19) Acceptance Criteria

* All tests pass in CI; critical module coverage ≥80%.
* Lighthouse: Perf >85, A11y >95 on core pages.
* Gamification works: XP accrual, at least 5 badges, weekly leaderboard.
* Labs graded automatically; optional AI feedback available.
* Admin can create/edit lessons, quizzes, labs, badges.
* Secure auth; rate limits; CSRF; validated inputs.

---

## 20) Risks & Mitigations

* **AI hallucinations** → constrain prompts; show diffs; require tests to pass; never auto‑merge.
* **Vendor lock‑in** → keep **AI providers behind an adapter**; Stripe payments behind a PSP interface (swap to Mollie later).
* **Scope creep** → ADRs + Project board; release in small vertical slices per track.

---

## 21) Roadmap (90 days)

* **Week 1–2**: Scaffold, auth, DB, seed, Home/Catalog.
* **Week 3–4**: Lessons, Quizzes, XP engine.
* **Week 5–6**: Labs + auto‑grader; AI prompt widgets.
* **Week 7–8**: Admin portal; badges; leaderboards.
* **Week 9–10**: E2E tests; performance/accessibility; polish.
* **Week 11–12**: Pilot cohort; feedback; iterate; GA.


