import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/server/session';
import { db } from '@/server/db';
import { recordXpEvent } from '@/server/xp';

export const runtime = 'nodejs';

const BodySchema = z.object({
  lessonSlug: z.string().min(1).max(100).optional(),
  exerciseTitle: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20000),
});

function basicCodeHeuristics(code: string) {
  const tooLong = code.length > 8000;
  const hasDescribe = /describe\(/.test(code);
  const hasTest = /(it\(|test\()/.test(code);
  const hasAssert = /(expect\(|assert\.)/.test(code);
  let score = 20;
  if (hasDescribe) score += 25;
  if (hasTest) score += 25;
  if (hasAssert) score += 20;
  if (tooLong) score = Math.max(0, score - 20);
  const feedback = [
    !hasDescribe ? 'Wrap scenarios in describe() blocks.' : null,
    !hasTest ? 'Add it()/test() cases for each scenario.' : null,
    !hasAssert ? 'Include assertions (expect()).' : null,
    tooLong ? 'Trim code to the essence for review.' : null,
  ]
    .filter(Boolean)
    .join(' ')
    || 'Solid start. Consider adding edge cases and negative paths.';
  return { score: Math.min(100, score), feedback };
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please login to submit exercises.' }, { status: 401 });
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const { lessonSlug, exerciseTitle, code } = body;
  const { score, feedback } = basicCodeHeuristics(code);
  const passed = score >= 80;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ score, pass: passed, feedback, persisted: false, offline: true });
  }

  try {
    const submission = await db.submission.create({
      data: {
        userId: session.user.id,
        code,
        status: passed ? 'PASSED' : 'FAILED',
        score,
        feedback,
      },
    });

    await db.aIEvaluation.create({
      data: {
        submissionId: submission.id,
        rubric: `${lessonSlug ? `code-${lessonSlug}` : 'code-generic'}${exerciseTitle ? `:${exerciseTitle}` : ''}`,
        model: process.env.OPENAI_API_KEY ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : 'offline',
        feedback,
        score,
      },
    });

    if (passed) {
      await recordXpEvent({ db, session } as any, { userId: session.user.id, kind: 'exercise_pass', amount: 10 });
    }

    return NextResponse.json({ score, pass: passed, feedback, submissionId: submission.id, persisted: true });
  } catch (e) {
    return NextResponse.json({ error: 'PERSIST_FAILED', message: 'Saved result could not be persisted. Please retry later.', score, pass: passed, feedback, persisted: false }, { status: 200 });
  }
}


