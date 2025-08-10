import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const leaderboardRouter = createTRPCRouter({
  top: publicProcedure
    .input(z.object({ period: z.enum(['weekly', 'allTime']), limit: z.number().int().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      const since = input.period === 'weekly' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined;

      const groups = await ctx.db.xPEvent.groupBy({
        by: ['userId'],
        _sum: { amount: true },
        ...(since ? { where: { createdAt: { gte: since } } } : {}),
      });

      const sorted = groups
        .map((g) => ({ userId: g.userId, xp: g._sum.amount ?? 0 }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, input.limit);

      const users = await ctx.db.user.findMany({
        where: { id: { in: sorted.map((s) => s.userId) } },
        include: { profile: true },
      });
      const byId = new Map(users.map((u) => [u.id, u] as const));
      const items = sorted.map((row, idx) => {
        const u = byId.get(row.userId);
        const label = u?.profile?.displayName || u?.email || 'User';
        return { rank: idx + 1, userId: row.userId, label, xp: row.xp };
      });
      return { items };
    }),
});


