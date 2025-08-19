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
      try {
        await ctx.db.lessonProgress.upsert({
          where: { userId_lessonId: { userId, lessonId: input.lessonId } },
          create: { userId, lessonId: input.lessonId },
          update: {},
        });
      } catch {}
      await recordXpEvent(ctx, { userId, kind: 'lesson_complete', amount: 10 });
      return { ok: true } as const;
    }),

  attempts: protectedProcedure
    .input(z.object({ slug: z.string().min(1), take: z.number().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const lesson = await ctx.db.lesson.findUnique({ where: { slug: input.slug } });
      if (!lesson) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lesson not found' });
      const attempts = await ctx.db.submission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: input.take ?? 5,
        select: { id: true, createdAt: true, status: true, score: true, feedback: true },
      });
      return attempts.map((a) => ({
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        status: a.status,
        score: a.score,
        feedback: a.feedback,
      }));
    }),
});

