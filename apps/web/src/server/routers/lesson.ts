import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { recordXpEvent } from '@/server/xp';

export const lessonRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.db.lesson.findUnique({ where: { slug: input.slug } });
      if (!lesson) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lesson not found' });
      }
      return lesson;
    }),

  complete: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      await recordXpEvent(ctx, { userId, kind: 'lesson_complete', amount: 10 });
      return { ok: true } as const;
    }),
});

