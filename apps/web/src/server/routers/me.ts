import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const meRouter = createTRPCRouter({
  progress: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id as string;
    const [xpEvents, badgesCount, passed, failed, pending] = await Promise.all([
      ctx.db.xPEvent.findMany({ where: { userId }, select: { amount: true } }),
      ctx.db.userBadge.count({ where: { userId } }),
      ctx.db.submission.count({ where: { userId, status: 'PASSED' as any } }),
      ctx.db.submission.count({ where: { userId, status: 'FAILED' as any } }),
      ctx.db.submission.count({ where: { userId, status: 'PENDING' as any } }),
    ]);
    const xpTotal = xpEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    return { xpTotal, badgesCount, submissions: { passed, failed, pending } };
  }),
});


