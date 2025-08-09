import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function verifyAgentSignature(rawBody: string, signatureHeader: string | null, secret?: string): boolean {
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }
  if (!signatureHeader) return false
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expected = `sha256=${hash}`
  return timingSafeEqual(expected, signatureHeader)
}

export const POST = async (req: Request) => {
  const rawBody = await req.text()
  const signature = req.headers.get('x-agent-signature-256')
  const event = req.headers.get('x-github-event') || 'unknown'
  const delivery = req.headers.get('x-github-delivery') || `${Date.now()}`

  const ok = verifyAgentSignature(rawBody, signature, process.env.CURSOR_AGENT_WEBHOOK_SECRET)
  if (!ok) return new NextResponse('Invalid signature', { status: 401 })

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const inboxDir = path.join(process.cwd(), '.agent', 'inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  const filename = `${Date.now()}-${delivery}-${event}.json`.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const filePath = path.join(inboxDir, filename)
  fs.writeFileSync(filePath, JSON.stringify({ event, delivery, payload }, null, 2), 'utf8')

  // Keep fast response; any heavy lifting should be done by a separate worker watching the inbox
  return NextResponse.json({ ok: true, stored: path.basename(filePath) })
}


