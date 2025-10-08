import { NextResponse } from 'next/server';
import { suggestDraftForPrompt } from '@/server/ai';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return Sentry.startSpan({ op: 'http.server', name: 'POST /api/ai/suggest' }, async (span) => {
    try {
      const { prompt } = await req.json();
      if (!prompt || typeof prompt !== 'string') return NextResponse.json({ error: 'invalid' }, { status: 400 });
      span.setAttribute('prompt.length', String(prompt.length));
      const suggestion = await suggestDraftForPrompt(prompt);
      return NextResponse.json({ suggestion });
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
  });
}


