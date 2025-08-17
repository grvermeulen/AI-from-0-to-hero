import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, resolveDbUserIdFromSession } from '@/server/trpc';
import { offlineMode } from '@/server/env';

export const labRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ labId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (offlineMode()) {
        return { id: input.labId, title: 'Sample Lab', description: 'Submit a repo URL or code snippet.' } as any;
      }
      const lab = await ctx.db.lab.findUnique({ where: { id: input.labId } });
      if (!lab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lab not found' });
      return lab;
    }),

  submit: protectedProcedure
    .input(z.object({ labId: z.string(), repoUrl: z.string().url().optional(), code: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveDbUserIdFromSession(ctx);
      if (offlineMode()) {
        return { id: 'stub-submission', status: 'PENDING' as const };
      }
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
      try {
        await ctx.db.xPEvent.create({ data: { userId, kind: 'lab_submit' as any, amount: 10 } });
      } catch {}
      return { id: created.id, status: 'PENDING' as const };
    }),
});


