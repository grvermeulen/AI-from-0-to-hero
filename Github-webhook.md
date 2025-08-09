## GitHub Webhook → Cursor Agent integration

This repo can receive GitHub webhooks and forward allowed events to a local Agent ingest endpoint that stores events in `.agent/inbox/` for processing.

Endpoints:
- `POST /api/github/webhook` — receives GitHub events, verifies `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET`, and forwards allowed events (`pull_request`, `issue_comment`, `pull_request_review`, `pull_request_review_comment`, `workflow_run`, `check_run`, `check_suite`, `status`, `issues`) to the agent ingest endpoint.
- `POST /api/agent/ingest` — receives forwarded events, verifies `x-agent-signature-256` using `CURSOR_AGENT_WEBHOOK_SECRET`, and writes them to `.agent/inbox/`.

Environment variables:
- `GITHUB_WEBHOOK_SECRET`: Shared secret configured on the GitHub webhook
- `CURSOR_AGENT_WEBHOOK_URL`: Where to forward events; for local dev use `http://localhost:3000/api/agent/ingest`
- `CURSOR_AGENT_WEBHOOK_SECRET`: Secret to sign the forwarded body

Local development:
1. Start the web app: `pnpm --filter web dev`
2. Expose your local server with a tunnel (ngrok or Cloudflare Tunnel), e.g. `ngrok http 3000`.
3. Configure a GitHub webhook (Repository Settings → Webhooks):
   - Payload URL: `https://<your-tunnel>/api/github/webhook`
   - Content type: `application/json`
   - Secret: `GITHUB_WEBHOOK_SECRET`
   - Events: send me everything, or select the list above.
4. In another terminal, watch the inbox to trigger agent polling: `pnpm agent:watch`

Notes:
- On `ping` events, the webhook returns `200` with `{ pong: true }`.
- If no `GITHUB_WEBHOOK_SECRET` is set and `NODE_ENV !== 'production'`, signature verification is skipped for convenience.
- Forwarding includes `x-github-event` and `x-github-delivery` headers and an optional `x-agent-signature-256` HMAC.
