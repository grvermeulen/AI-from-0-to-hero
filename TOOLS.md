## Tooling and Workflow Guide

This document summarizes the tools and automation used to build and operate this project.

### Prerequisites
- Node managed via `nvm` (see `.nvmrc` → Node 20)
- Package manager: `pnpm` (via Corepack)

### GitHub CLI (tasks and reviews)
- Install: `brew install gh` (or see GitHub CLI docs)
- Authenticate: `gh auth login`
- Create agent task issues: use the "Agent Task" template and labels `agent:assistant`, `status:ready`, plus a priority label.
- Useful commands:
  - Create: `gh issue create --title "[Agent] <title>" --label "agent:assistant,status:ready,priority:P2" --body "..."`
  - Update status: `gh issue edit <number> --add-label status:in-progress`

### Webhook Listener (GitHub → Agent)
Routes in the web app accept GitHub webhooks and forward to the local agent:
- Incoming GitHub webhook: `apps/web/src/app/api/github/webhook/route.ts`
  - Validates `x-hub-signature-256` with `GITHUB_WEBHOOK_SECRET`
  - Forwards payloads to the agent ingest URL with `x-agent-signature-256`
- Local agent ingest: `apps/web/src/app/api/agent/ingest/route.ts`
  - Validates `x-agent-signature-256` with `CURSOR_AGENT_WEBHOOK_SECRET`
  - Writes events to `.agent/inbox/*.json`

Environment variables:
- `GITHUB_WEBHOOK_SECRET`: HMAC secret for GitHub signature verification
- `CURSOR_AGENT_WEBHOOK_URL`: Agent endpoint to forward GitHub events
- `CURSOR_AGENT_WEBHOOK_SECRET`: HMAC secret for agent signature

### Local Agent Automation
Scripts located under `.agent/`:
- `poller.js`: lists open issues labeled `agent:assistant,status:ready`
- `watch-inbox.js`: watches `.agent/inbox` for webhook payloads, triggers the poller, and runs PR reviews on PR events
- `review-pr.js`: performs an automated PR review (build, typecheck, tests, diff summary) and prints a report; can optionally post a PR comment with `GITHUB_TOKEN`
- `seed-labels.js`: creates common labels in the GitHub repo (requires `GITHUB_TOKEN` with repo scope)

Package scripts:
- `pnpm agent:poll` → run the issue poller
- `pnpm agent:watch` → start the inbox watcher (reacts to webhook payloads)
- `pnpm agent:seed-labels` → seed labels on the GitHub repo
Manual review runner usage:
- From payload file: `node .agent/review-pr.js .agent/inbox/<payload>.json`
- From PR number: `PR_NUMBER=5 node .agent/review-pr.js`

To enable auto PR comments, export:
```
export GITHUB_TOKEN=<PAT with repo scope>
```

### Issue Template for Agent Tasks
- File: `.github/ISSUE_TEMPLATE/agent-task.yml`
- Required labels: `agent:assistant`, `status:ready`; add one of `priority:P1|P2|P3`
- Include context, task description, and acceptance criteria

### Railway (MCP) — optional deployment tooling
We utilize Railway as the hosting/deployment target and have an MCP-based workflow available to automate:
- Listing services, variables, domains, deployments
- Triggering deployments and restarting services

Setup (if using CLI or API from local scripts):
- Create a Railway API token and export it as `RAILWAY_TOKEN` or configure in your environment
- Typical ops: manage service variables, trigger deployments, and monitor logs

Note: Some MCP integrations are used by the AI agent; for manual equivalents use the Railway Dashboard or CLI.

### Testing and Quality
- Unit tests: `pnpm --filter web test:ci` (Vitest)
- Type check: `pnpm -r typecheck`
- Build: `pnpm -r build` (Next.js)

### CI/CD
- GitHub Actions workflow lives under `.github/workflows/` (if present); CI runs typecheck/tests and builds

### Security Notes
- Do not commit secrets; use env vars and GitHub/Railway secrets
- Webhook routes validate HMAC signatures; tighten rate limits and payload size where needed


