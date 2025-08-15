## Installation and Local Setup

### Prerequisites
- Node 20 (use `nvm`), pnpm (via Corepack), Docker (optional for local Postgres)

### 1) Clone and Node setup
```
nvm use
pnpm install
```

### 2) Database options (choose ONE)

- Local Docker Postgres (recommended for quick start)
```
pnpm db:docker:start
pnpm db:env:docker
pnpm db:push
pnpm db:seed
```

- Managed Postgres (Railway/Supabase/Neon/etc.)
```
DB_URL='postgresql://user:pass@host:5432/db?schema=public' pnpm db:env:url
pnpm db:push
pnpm db:seed
```

### 3) Run the app
```
pnpm dev
# App will be on http://localhost:3000 (or 3001 if 3000 is in use)

pnpm db:docker:start && pnpm db:env:docker && pnpm db:push && pnpm db:seed && pnpm dev
# Make sure docker is started and it launch docker db & seed it with data, then the app will run on http://localhost:3000 using the db. 

```

### 4) Webhook and Agent automation (optional)

Create app web secrets (apps/web/.env.local):
```
GITHUB_WEBHOOK_SECRET=<any string>
CURSOR_AGENT_WEBHOOK_SECRET=<any string>
CURSOR_AGENT_WEBHOOK_URL=http://localhost:3000/api/agent/ingest
```

Run the inbox watcher:
```
pnpm agent:watch
```

Expose your local server (pick one):
```
ngrok http 3000
# or Cloudflare Tunnel, or any equivalent
```

Auto-update the GitHub webhook URL to your tunnel (requires a PAT):
```
export GITHUB_TOKEN=<PAT with repo scope>
pnpm agent:webhook:update
```

Now PR comments can drive automation:
- `/review` → runs automated review
- `/labels: status:ready, priority:P2` → adds labels
- `/apply:force-dynamic login signup` → applies a safe fix and opens a PR

### 5) Useful scripts
```
# DB helpers
pnpm db:docker:start    # start local Postgres in Docker
pnpm db:env:docker      # write DATABASE_URL for local Docker
DB_URL=... pnpm db:env:url  # write DATABASE_URL to .env from your string
pnpm db:push            # apply Prisma schema
pnpm db:seed            # seed initial content/lessons

# Agent helpers
pnpm agent:watch        # react to webhook inbox events
pnpm agent:webhook:update  # sync webhook URL to current tunnel
```

### 6) Tests and typecheck
```
pnpm -r typecheck
pnpm --filter web test:ci
```

### Notes
- If port 3000 is busy, Next.js will use 3001; update `CURSOR_AGENT_WEBHOOK_URL` accordingly.
- For local testing without signatures, leave webhook secrets unset and keep `NODE_ENV` as development.

