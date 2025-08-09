## GitHub Webhook → Agent Integration

This project can receive GitHub webhooks in the Next.js app, verify signatures, and forward selected events to an agent ingest endpoint. The ingest endpoint writes events to `.agent/inbox/`, and a watcher triggers the agent poller based on those events.

### Endpoints
- `POST /api/github/webhook`
  - Verifies `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET`
  - Accepts events: `pull_request`, `issue_comment`, `pull_request_review`, `pull_request_review_comment`, `workflow_run`, `check_run`, `check_suite`, `status`, `issues`
  - Forwards payload to `CURSOR_AGENT_WEBHOOK_URL` with headers `x-github-event`, `x-github-delivery`, and `x-agent-signature-256` (HMAC using `CURSOR_AGENT_WEBHOOK_SECRET`)

- `POST /api/agent/ingest`
  - Verifies `x-agent-signature-256` using `CURSOR_AGENT_WEBHOOK_SECRET`
  - Writes `{ event, delivery, payload }` as JSON into `.agent/inbox/`

### Environment Variables (apps/web/.env.local)
```
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
CURSOR_AGENT_WEBHOOK_URL=http://localhost:3000/api/agent/ingest
CURSOR_AGENT_WEBHOOK_SECRET=your_agent_forward_secret
```

Notes:
- In non‑production, signature checks are skipped if the corresponding secret is unset (for convenience).
- Keep secrets unique per environment.

### Run Locally
1. Start the Next.js app:
   ```bash
   pnpm --filter web dev
   ```
2. Start the agent inbox watcher (separate terminal):
   ```bash
   pnpm agent:watch
   ```
3. Expose your local server with a tunnel (choose one):
   - ngrok: `ngrok http 3000`
   - Cloudflare Tunnel: `cloudflared tunnel run <name>`
   - smee.io: create a channel and run the smee client to forward to `http://localhost:3000/api/github/webhook`

### Configure GitHub Webhook (Repository Settings → Webhooks)
- Payload URL: `https://<your-tunnel>/api/github/webhook`
- Content type: `application/json`
- Secret: the value of `GITHUB_WEBHOOK_SECRET`
- Events: select the list above (or use “send me everything”)

### Quick Test (ping)
```bash
DATA='{"zen":"Keep it logically awesome."}'
SIG="sha256=$(echo -n $DATA | openssl dgst -sha256 -hmac $GITHUB_WEBHOOK_SECRET | cut -d ' ' -f2)"
curl -X POST http://localhost:3000/api/github/webhook \
  -H "X-Hub-Signature-256: $SIG" \
  -H "X-GitHub-Event: ping" \
  -H "Content-Type: application/json" \
  --data "$DATA"
```
Expected response: `{ "ok": true, "pong": true }`.

### Flow Overview
1. GitHub → `/api/github/webhook` (signature verified)
2. Forward to `/api/agent/ingest` (signed with `x-agent-signature-256`)
3. Event JSON written to `.agent/inbox/`
4. `.agent/watch-inbox.js` detects file and triggers `.agent/poller.js` (debounced)

### Operational Tips
- Keep webhook handlers fast: verify, enqueue/forward, respond 2xx.
- Use GitHub’s redelivery if a delivery fails. Monitor deliveries in Webhook settings.
- For CI updates, you may subscribe to `workflow_run` (GitHub Actions) or `check_*`/`status` depending on your CI provider.


