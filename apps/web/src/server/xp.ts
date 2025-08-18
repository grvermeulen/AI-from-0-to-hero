import type { TRPCContext } from '@/server/trpc';

async function maybeAwardBadge(ctx: TRPCContext, userId: string, kind: string) {
  try {
    let badgeSlug: string | undefined;
    if (kind === 'lesson_complete') badgeSlug = 'first-lesson';
    else if (kind === 'quiz_pass') badgeSlug = 'first-quiz-pass';
    else if (kind === 'lab_submit') badgeSlug = 'first-lab-submit';
    else if (kind === 'exercise_pass') badgeSlug = 'first-exercise-pass';
    if (!badgeSlug) return;

    const badge = await ctx.db.badge.findUnique({ where: { slug: badgeSlug } });
    if (!badge) return;
    const hasIt = await ctx.db.userBadge.findFirst({ where: { userId, badgeId: badge.id } });
    if (hasIt) return;
    await ctx.db.userBadge.create({ data: { userId, badgeId: badge.id } });
  } catch {
    // best-effort; ignore award failures
  }
}

export async function recordXpEvent(
  ctx: TRPCContext,
  params: { userId: string; kind: 'lesson_complete' | 'quiz_submit' | 'quiz_pass' | 'lab_submit' | 'exercise_pass'; amount: number },
) {
  try {
    await ctx.db.xPEvent.create({ data: { userId: params.userId, kind: params.kind, amount: params.amount } });
  } catch {
    // ignore xp write failures
  }
  await maybeAwardBadge(ctx, params.userId, params.kind);
}


