import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const meRouter = createTRPCRouter({
  progress: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id as string;
    // Dev fallback: if DB is not configured locally, return minimal defaults
    if (!process.env.DATABASE_URL) {
      return { xpTotal: 0, badgesCount: 0, badges: [], streakDays: 0, submissions: { passed: 0, failed: 0, pending: 0 } };
    }
    const [xpEvents, badgesCount, badges, passed, failed, pending] = await Promise.all([
      ctx.db.xPEvent.findMany({ where: { userId }, select: { amount: true, createdAt: true } }),
      ctx.db.userBadge.count({ where: { userId } }),
      ctx.db.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      ctx.db.submission.count({ where: { userId, status: 'PASSED' as any } }),
      ctx.db.submission.count({ where: { userId, status: 'FAILED' as any } }),
      ctx.db.submission.count({ where: { userId, status: 'PENDING' as any } }),
    ]);
    const xpTotal = xpEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    // Streak calculation: consecutive days with any XP, ending today
    const dayKey = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
    const xpDays = new Set(xpEvents.map((e) => dayKey(e.createdAt)));
    let streakDays = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      if (xpDays.has(dayKey(d))) streakDays += 1;
      else break;
    }
    return {
      xpTotal,
      badgesCount,
      badges: badges.map((b) => ({ id: b.badge.id, name: b.badge.name, icon: b.badge.icon, earnedAt: b.earnedAt })),
      streakDays,
      submissions: { passed, failed, pending },
    };
  }),
});


