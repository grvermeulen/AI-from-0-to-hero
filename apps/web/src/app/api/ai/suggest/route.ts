import { NextResponse } from 'next/server';
import { suggestDraftForPrompt } from '@/server/ai';
import { checkRateLimit, getClientIp } from '@/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit({ key: `ai:suggest:${ip}`, limit: 20, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'RATE_LIMITED', message: 'Too Many Requests', retryAfter: rl.retryAfter }, { status: 429 });
    }
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const suggestion = await suggestDraftForPrompt(prompt);
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}


