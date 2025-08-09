import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

// Ensure Node.js runtime (not edge) so we can use crypto APIs comfortably
export const runtime = 'nodejs'

type ForwardResult = {
  forwarded: boolean
  status?: number
  error?: string
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function verifyGitHubSignature(rawBody: string, signatureHeader: string | null, secret: string | undefined): boolean {
  if (!secret) {
    // Allow missing secret in non-production for local development convenience
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }
  if (!signatureHeader) return false
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expected = `sha256=${computed}`
  return timingSafeEqual(expected, signatureHeader)
}

async function forwardToCursorAgent(
  payload: unknown,
  headers: { event: string; deliveryId: string },
): Promise<ForwardResult> {
  const agentUrl = process.env.CURSOR_AGENT_WEBHOOK_URL
  if (!agentUrl) return { forwarded: false, error: 'Cursor Agent URL not configured' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  const body = JSON.stringify(payload)

  const extraSecret = process.env.CURSOR_AGENT_WEBHOOK_SECRET
  const agentSignature = extraSecret
    ? `sha256=${crypto.createHmac('sha256', extraSecret).update(body).digest('hex')}`
    : undefined

  try {
    const resp = await fetch(agentUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': headers.event,
        'x-github-delivery': headers.deliveryId,
        ...(agentSignature ? { 'x-agent-signature-256': agentSignature } : {}),
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return { forwarded: true, status: resp.status }
  } catch (error) {
    clearTimeout(timeout)
    return { forwarded: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const POST = async (req: Request) => {
  const rawBody = await req.text()

  const sig = req.headers.get('x-hub-signature-256')
  const event = req.headers.get('x-github-event') ?? 'unknown'
  const deliveryId = req.headers.get('x-github-delivery') ?? ''
  const secret = process.env.GITHUB_WEBHOOK_SECRET

  const ok = verifyGitHubSignature(rawBody, sig, secret)
  if (!ok) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // GitHub sends `ping` to validate the webhook
  if (event === 'ping') {
    return NextResponse.json({ ok: true, pong: true })
  }

  // Parse after signature check to avoid JSON work on untrusted requests
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  // Basic allowlist of events this route is concerned with
  const allowedEvents = new Set([
    'pull_request',
    'issue_comment',
    'pull_request_review',
    'pull_request_review_comment',
    'workflow_run',
    'check_run',
    'check_suite',
    'status',
    'issues',
  ])

  if (!allowedEvents.has(event)) {
    // Accept but no-op for other events to keep webhook green
    return NextResponse.json({ ok: true, ignored: true, event })
  }

  const forward = await forwardToCursorAgent(payload, { event, deliveryId })

  return NextResponse.json({ ok: true, event, deliveryId, forward })
}


