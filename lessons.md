## AI-First QA Curriculum (Java track)

This curriculum turns manual/ReadyAPI-focused testers into AI-augmented Quality Engineers who can design, automate, and operate API tests end-to-end using Java. Each lesson explains what you learn, how you’ll practice, and how AI accelerates the work. Python track may follow later.

Guiding principles
- Learn by shipping: every lesson ends with a working test artifact in Git, reviewed via PR.
- Test like devs: code-first tests (JUnit 5, Rest-Assured, WireMock, Testcontainers), infra-as-code, reproducible in Docker.
- AI as a copilot: use structured prompts and guardrails; always verify with assertions and CI.

Tracks and progression
1) Foundation (dev skills for QA)
2) Migration (ReadyAPI → Rest-Assured)
3) Practitioner (E2E + integration with WireMock)
4) CI/CD in Azure DevOps (Dockerized pipelines + Allure)
5) Advanced AI in SDLC (analysis, risk-based testing, contribution back)

Format per lesson
- Subject: the focus topic
- You’ll learn: concrete skills and concepts
- How we do it: lab(s), repo structure, AI prompts, acceptance criteria
- Deliverable: what must be in the PR to pass

Prerequisites
- Basic Git, terminal, Docker Desktop
- Java 17+, Maven or Gradle, IntelliJ IDEA Community

---

### Track 1 — Foundation

1) Java Toolchain & Project Scaffolding
- You’ll learn: JDK 17+, Maven vs Gradle, project layout, dependency management, IDE setup, Git workflows.
- How we do it: scaffold a Maven project; add JUnit 5; run in Docker (`maven:3-eclipse-temurin-17`). AI prompts to generate `pom.xml` and CI cache hints.
- Deliverable: repo with `mvn test` green locally and in container.

2) JUnit 5 Essentials
- You’ll learn: test lifecycle, parameterized tests, assumptions, tagging, test fixtures.
- How we do it: create sample unit tests; enforce naming and structure. AI drafts parameterized variants; you verify edge cases.
- Deliverable: passing JUnit suite with clear naming and tags.

3) API Fundamentals for Test Engineers
- You’ll learn: HTTP methods, status codes, headers, auth, idempotency, pagination, error contracts.
- How we do it: small Node/Java mock service; exploratory calls with `curl`/Postman; capture invariants for later assertions. AI generates checklists and negative cases.
- Deliverable: a written checklist of invariants + example requests/responses committed in `docs/`.

4) Rest-Assured Basics
- You’ll learn: request specs, given/when/then, matchers, JSONPath, reusable utilities, timeouts/retries.
- How we do it: write first API tests against a public HTTP API; factor common spec; add JSON assertions. AI suggests matcher patterns and refactors.
- Deliverable: `rest-assured`-based tests with a shared `RequestSpecification`.

5) Test Data & Fixtures
- You’ll learn: Faker, builders, factories, data seeding strategies, minimizing flakiness.
- How we do it: add builders for domain objects; seed data via API; isolate data with unique prefixes. AI proposes factories and edge-case permutations.
- Deliverable: deterministic tests with data builders and clear cleanup.

---

### Track 2 — Migration: ReadyAPI → Rest-Assured

6) Inventory & Prioritization of ReadyAPI Suites
- You’ll learn: mapping suites/cases to code modules, risk-based prioritization, coverage baseline.
- How we do it: parse ReadyAPI project (XML/YAML); pick a high-value flow; define acceptance and coverage targets. AI summarizes suite structure and suggests a migration order.
- Deliverable: migration plan in `docs/migration-plan.md` with prioritized list and risks.

7) Converting a Simple ReadyAPI Test to Rest-Assured
- You’ll learn: translating requests, auth, assertions, extracting values for chaining.
- How we do it: convert one simple case; keep parity with assertions. AI produces a draft Java test from the exported ReadyAPI case; you tighten assertions.
- Deliverable: PR with the converted test + parity checklist.

8) Handling Auth, Variables, and Environments
- You’ll learn: OAuth2/Bearer tokens, environment switching, secrets handling, config objects.
- How we do it: introduce env profiles (dev/int); secure secrets via env vars; token refresh helper. AI drafts config classes and token client.
- Deliverable: environment-aware tests and secrets externalized.

9) Negative Testing & Error Contracts
- You’ll learn: asserting error payloads, boundary conditions, rate limits, contract drift detection.
- How we do it: add failing-path tests; JSON schema validation; custom matchers for error codes. AI proposes negative-path matrices.
- Deliverable: suite with both happy and unhappy paths, schema checks.

10) Data-Driven and Reusable Flows
- You’ll learn: parameterization, CSV/JSON-driven cases, reusable flows (login → action → verify).
- How we do it: convert a multi-step ReadyAPI flow; introduce builders and helpers. AI generalizes steps into reusable methods.
- Deliverable: DRY test flows with data-driven inputs.

---

### Track 3 — Practitioner: E2E + Integration with WireMock

11) WireMock Fundamentals
- You’ll learn: stubbing, recordings, matchers, verification, scenario states.
- How we do it: spin up WireMock via Docker/Testcontainers; isolate a dependency; verify requests. AI creates initial stub mappings from example traffic.
- Deliverable: repeatable integration tests using WireMock container.

12) Contract and Consumer-Driven Tests
- You’ll learn: JSON schema, versioning, Pact basics (optional), backward compatibility checks.
- How we do it: add contract tests for key endpoints; break-change alerting. AI drafts schemas from real payloads and tightens properties.
- Deliverable: contract checks in CI with clear failure messages.

13) Resilience & Flakiness Control
- You’ll learn: timeouts, retries with backoff, idempotency keys, clock control, test isolation.
- How we do it: configure Rest-Assured timeouts; deterministic time via libraries; eliminate shared state. AI suggests retry policies and flaky-test detectors.
- Deliverable: stable test runs across 3 consecutive CI executions.

14) Testcontainers for Ephemeral Environments
- You’ll learn: on-demand dependencies (DB, WireMock, S3), network aliases, lifecycle management.
- How we do it: wrap dependencies in Testcontainers; port into CI job; cache layers. AI proposes container definitions and waits.
- Deliverable: a green run with all deps started in-code.

15) Reporting with Allure
- You’ll learn: Allure annotations, attachments, steps, history trends.
- How we do it: integrate Allure; attach request/response; publish artifacts. AI wires the Maven plugin and example attachments.
- Deliverable: Allure report artifact with rich context.

---

### Track 4 — CI/CD in Azure DevOps (Dockerized)

16) Azure Pipelines 101 (YAML)
- You’ll learn: stages/jobs/steps, caching Maven repo, parallelism, artifacts.
- How we do it: create `azure-pipelines.yml`; run tests in `mcr.microsoft.com/devcontainers/java` or custom Docker image; publish Allure.
- Deliverable: pipeline passing with cached dependencies and test artifact upload.

17) Dockerized Local ≈ CI Parity
- You’ll learn: containerizing tests, mounting secrets, resource limits, debug shells.
- How we do it: a `docker-compose` for tests + WireMock + any deps; ensure parity with pipeline image. AI produces Dockerfiles and compose services.
- Deliverable: `docker compose up test` mirrors CI behavior.

18) Quality Gates and Insights
- You’ll learn: JaCoCo coverage, PMD/SpotBugs, fail-on-threshold, trend reporting.
- How we do it: wire JaCoCo, publish coverage to pipeline summary, set thresholds. AI writes config snippets and badge setup.
- Deliverable: failing gate when coverage < threshold; visible report.

---

### Track 5 — Advanced AI Across the SDLC

19) AI Prompt Engineering for Testing
- You’ll learn: prompts that produce test cases, negative paths, boundary sets; reducing hallucinations.
- How we do it: use structured prompt templates; validate outputs against schemas; compare AI vs human baseline.
- Deliverable: prompt templates committed with examples and validation results.

20) AI-Assisted Refactoring and Reviews
- You’ll learn: code health prompts, deduplication, improving assertions, PR review checklists.
- How we do it: open a PR; ask AI to propose safe refactors; you run tests and accept minimal diffs.
- Deliverable: PR merged with improved readability and coverage intact.

21) AI in Planning and Risk-Based Testing
- You’ll learn: turning requirements/user stories into risk matrices and test plans; impact analysis per change.
- How we do it: prompt AI with diff + domain context; generate candidate tests; select and implement high-risk items.
- Deliverable: doc+tests showing risk mapping to implemented checks.

22) Contributing Back: Building the Training Platform
- You’ll learn: adding lessons/modules in this repo, writing MDX content, extending graders, adding CI checks.
- How we do it: add a new lesson PR; create tests and acceptance; wire into navigation. AI assists with boilerplate and docs.
- Deliverable: a merged PR that expands the training program itself.

---

Capstone Project (End-to-End)
- Migrate a realistic ReadyAPI suite to a full Java codebase:
  - Rest-Assured E2E tests (happy + negative)
  - WireMock integration tests for 2 dependencies
  - Testcontainers-managed deps
  - Allure reporting enriched with artifacts
  - Azure DevOps pipeline in Docker, with coverage gate
  - AI-assisted planning, triage, and refactoring evidence
- Review: PR-based evaluation, rubric scoring, and live demo.

---

How the program works it out
- Each lesson includes: a short reading, an AI prompt template, a lab repo task, and a PR with acceptance checks.
- Feedback loops: automated tests + reviewer checklist; optional AI feedback.
- Evidence: Allure links, CI runs, and coverage trends are attached to issues/PRs.
- Mastery: completing all tracks qualifies you to contribute new lessons and mentor peers using AI.


