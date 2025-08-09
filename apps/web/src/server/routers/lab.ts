import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const labRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ labId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lab = await ctx.db.lab.findUnique({ where: { id: input.labId } });
      if (!lab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lab not found' });
      return lab;
    }),

  submit: protectedProcedure
    .input(z.object({ labId: z.string(), repoUrl: z.string().url().optional(), code: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;
      // Minimal stub: store submission as PENDING for later grading
      const created = await ctx.db.submission.create({
        data: {
          userId,
          labId: input.labId,
          repoUrl: input.repoUrl,
          code: input.code,
          status: 'PENDING' as any,
        },
      });
      return { id: created.id, status: 'PENDING' as const };
    }),
});


