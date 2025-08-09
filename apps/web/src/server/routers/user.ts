import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '@/server/trpc';

export const userRouter = createTRPCRouter({
  search: adminProcedure
    .input(z.object({ q: z.string().min(1), limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.user.findMany({
        where: {
          OR: [
            { email: { contains: input.q, mode: 'insensitive' } },
            { profile: { is: { displayName: { contains: input.q, mode: 'insensitive' } } } },
          ],
        },
        take: input.limit,
        include: { profile: true },
      });
      return { items };
    }),

  promote: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(['ADMIN', 'STAFF', 'LEARNER']) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.user.update({ where: { id: input.userId }, data: { role: input.role as any } });
      return { id: updated.id, role: updated.role };
    }),
});


