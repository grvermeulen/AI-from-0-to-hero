## Agent/Webhook Architecture

This document explains how GitHub webhooks are received, verified, and forwarded to the local Agent, and how the Agent automates reviews and repository maintenance.

### Data Flow

1. GitHub → Web App
   - Webhook requests are sent to `POST /api/github/webhook`.
   - We validate `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET` with a timing‑safe compare.
   - Allowed events: `pull_request`, `issue_comment`, `pull_request_review`, `pull_request_review_comment`, `workflow_run`, `check_run`, `check_suite`, `status`, `issues`.

2. Web App → Agent (forwarder)
   - The web app forwards the JSON payload to the local Agent ingest endpoint `CURSOR_AGENT_WEBHOOK_URL` (default `http://localhost:3000/api/agent/ingest`).
   - Forwarded requests carry headers: `x-github-event`, `x-github-delivery`. If `CURSOR_AGENT_WEBHOOK_SECRET` is configured, a secondary HMAC header `x-agent-signature-256` is included.

3. Agent Ingest (Web App)
   - `POST /api/agent/ingest` validates `x-agent-signature-256` using `CURSOR_AGENT_WEBHOOK_SECRET`.
   - Each event is written to `.agent/inbox/<timestamp>-<delivery>-<event>.json` for offline processing.

4. Agent Workers (Node scripts)
   - `.agent/watch-inbox.js` watches the inbox, debounces storms, and triggers `.agent/poller.js`.
   - On PR events it may run `.agent/review-pr.js` (build, typecheck, unit tests, summaries) and `.agent/act-on-comment.js` (react to commands in PR comments such as `/review`, `/labels`).

### Security Controls

- Webhook signature validation (GitHub) with constant‑time comparison
- Optional agent forward signature (`x-agent-signature-256`)
- Strict allowlist of events to reduce surface area
- Short network timeouts when forwarding to avoid blocking the webhook response
- Rate‑limit authentication endpoints (`/api/auth/[...nextauth]` POST and `/api/auth/signup`)

### Local Development

- Start the web app: `pnpm --filter web dev`
- Expose local server: `ngrok http 3000`
- Update the GitHub webhook to the current tunnel URL: `pnpm agent:webhook:update`
- Run watchers: `pnpm agent:watch`

### Extensibility

- New event handlers can be added in the Agent by subscribing in `.agent/watch-inbox.js` and dispatching to purpose‑built scripts.
- Use small, composable scripts with clear exit codes; keep webhook handlers fast and side‑effect free (write to inbox only).

# Architecture Overview

- Monorepo managed by pnpm workspaces
- App Router (Next.js 14) in `apps/web`
- tRPC for API layer with Zod validation
- Prisma ORM with PostgreSQL
- Tailwind CSS for UI

