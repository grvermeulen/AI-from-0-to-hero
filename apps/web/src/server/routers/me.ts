import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const meRouter = createTRPCRouter({
  progress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user!.id;
    // Dev fallback: if DB is not configured locally, return minimal defaults
    if (!process.env.DATABASE_URL) {
      return { xpTotal: 0, badgesCount: 0, badges: [], streakDays: 0, submissions: { passed: 0, failed: 0, pending: 0 } };
    }
    const [xpEvents, badgesCount, badges, passed, failed, pending, recentSubs] = await Promise.all([
      ctx.db.xPEvent.findMany({ where: { userId }, select: { amount: true, createdAt: true } }),
      ctx.db.userBadge.count({ where: { userId } }),
      ctx.db.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      ctx.db.submission.count({ where: { userId, status: 'PASSED' } }),
      ctx.db.submission.count({ where: { userId, status: 'FAILED' } }),
      ctx.db.submission.count({ where: { userId, status: 'PENDING' } }),
      ctx.db.submission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, status: true, score: true, createdAt: true } }),
    ]);
    const xpTotal = xpEvents.reduce((sum: number, e: { amount?: number | null; createdAt: Date }) => sum + (e.amount ?? 0), 0);
    // Streak calculation: consecutive days with any XP, ending today
    const dayKey = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
    const xpDays = new Set(xpEvents.map((e: { createdAt: Date }) => dayKey(e.createdAt)));
    let streakDays = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      if (xpDays.has(dayKey(d))) streakDays += 1;
      else break;
    }
    // Compute badge popularity percentages and available (not yet earned) badges
    let badgesEarned: Array<{ id: string; name: string; icon?: string | null; earnedAt: Date; percentUsers?: number }> = [];
    let badgesAvailable: Array<{ id: string; name: string; icon?: string | null; percentUsers?: number }> = [];
    try {
      const totalUsers = await ctx.db.user.count();
      const allBadges = await ctx.db.badge.findMany();
      const grouped = await ctx.db.userBadge.groupBy({ by: ['badgeId'], _count: { badgeId: true } });
      const countByBadgeId = new Map<string, number>(grouped.map((g: any) => [g.badgeId as string, g._count.badgeId as number]));
      const percentFor = (badgeId: string) => (totalUsers > 0 ? Math.round(((countByBadgeId.get(badgeId) ?? 0) / totalUsers) * 100) : 0);
      const earnedIds = new Set<string>(badges.map((b: any) => b.badge.id as string));
      badgesEarned = badges.map((b: any) => ({ id: b.badge.id, name: b.badge.name, icon: b.badge.icon, earnedAt: b.earnedAt, percentUsers: percentFor(b.badge.id) }));
      badgesAvailable = allBadges
        .filter((b: any) => !earnedIds.has(b.id))
        .map((b: any) => ({ id: b.id, name: b.name, icon: b.icon, percentUsers: percentFor(b.id) }));
    } catch {
      // In test or offline mode, gracefully degrade without percentages
      badgesEarned = badges.map((b: any) => ({ id: b.badge.id, name: b.badge.name, icon: b.badge.icon, earnedAt: b.earnedAt }));
      badgesAvailable = [];
    }

    return {
      xpTotal,
      badgesCount,
      badges: badgesEarned, // keep legacy field for recent badges list
      badgesEarned,
      badgesAvailable,
      streakDays,
      submissions: { passed, failed, pending },
      recentSubmissions: recentSubs,
    };
  }),
});


