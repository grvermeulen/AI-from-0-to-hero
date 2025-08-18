import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/server/session';
import { db } from '@/server/db';
import { recordXpEvent } from '@/server/xp';

export const runtime = 'nodejs';

const BodySchema = z.object({
  lessonSlug: z.string().min(1).max(100).optional(),
  input: z.string().min(1).max(5000),
});

function scoreGitIntro(input: string) {
  const text = input.toLowerCase();
  const required = ['git init', 'git add', 'git commit'];
  const hits = required.filter((r) => text.includes(r)).length;
  const score = Math.round((hits / required.length) * 100);
  const missing = required.filter((r) => !text.includes(r));
  const feedback = missing.length
    ? `Nice start! You are missing: ${missing.join(', ')}. Try adding those commands.`
    : 'Great job! You covered the essential init → add → commit flow.';
  return { score, feedback };
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const { lessonSlug, input } = body;

  // Deterministic scoring first (offline-friendly)
  let score = 0;
  let feedback = 'Thanks for your attempt!';
  if (lessonSlug === 'intro-to-git') {
    const res = scoreGitIntro(input);
    score = res.score;
    feedback = res.feedback;
  } else {
    // Generic heuristic: give partial credit if commands look valid
    const looksLikeCommands = /(git|npm|pnpm|yarn)\s+/.test(input);
    score = looksLikeCommands ? 60 : 30;
    feedback = looksLikeCommands
      ? 'Good start! Consider ordering steps and committing meaningful messages.'
      : 'Try using concrete commands (e.g., git init/add/commit).';
  }

  const passed = score >= 80;

  // Persist submission + evaluation
  const submission = await db.submission.create({
    data: {
      userId: session.user.id,
      answers: JSON.stringify({ kind: 'command', lessonSlug: lessonSlug ?? null, input }),
      status: passed ? 'PASSED' : 'FAILED',
      score,
      feedback,
    },
  });

  await db.aIEvaluation.create({
    data: {
      submissionId: submission.id,
      rubric: lessonSlug ? `command-${lessonSlug}` : 'command-generic',
      model: process.env.OPENAI_API_KEY ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : 'offline',
      feedback,
      score,
    },
  });

  if (passed) {
    await recordXpEvent({ db, session } as any, { userId: session.user.id, kind: 'exercise_pass', amount: 10 });
  }

  return NextResponse.json({ score, pass: passed, feedback, submissionId: submission.id });
}


