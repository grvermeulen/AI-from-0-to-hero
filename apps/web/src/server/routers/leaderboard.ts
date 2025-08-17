import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const leaderboardRouter = createTRPCRouter({
  top: publicProcedure
    .input(z.object({ period: z.enum(['weekly', 'all']).default('weekly'), limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      // Dev fallback: if DB is not configured locally, return empty leaderboard
      if (!process.env.DATABASE_URL) {
        return [];
      }
      const since = input.period === 'weekly' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined;

      const groups = await ctx.db.xPEvent.groupBy({
        by: ['userId'],
        _sum: { amount: true },
        ...(since ? { where: { createdAt: { gte: since } } } : {}),
        orderBy: { _sum: { amount: 'desc' } },
        take: input.limit,
      });

      const users = await ctx.db.user.findMany({
        where: { id: { in: groups.map((g: { userId: string }) => g.userId) } },
        include: { profile: true },
      });
      const idToName = new Map(users.map((u: { id: string; profile: { displayName?: string | null } | null; email: string | null }) => [u.id, u.profile?.displayName || u.email]));
      return groups.map((g: { userId: string; _sum: { amount: number | null } }, idx: number) => ({ rank: idx + 1, userId: g.userId, label: (idToName.get(g.userId) as string | undefined) || g.userId, xp: g._sum.amount || 0 }));
    }),
});


