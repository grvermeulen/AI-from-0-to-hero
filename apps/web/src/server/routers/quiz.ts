import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const quizRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId },
        include: { questions: true },
      });
      if (!quiz) throw new TRPCError({ code: 'NOT_FOUND', message: 'Quiz not found' });
      // Hide answers when starting quiz
      const questions = quiz.questions.map((q) => ({ id: q.id, kind: q.kind, prompt: q.prompt, options: q.options }));
      return { id: quiz.id, title: quiz.title, questions };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        quizId: z.string(),
        answers: z.record(z.string(), z.string()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;
      const quiz = await ctx.db.quiz.findUnique({ where: { id: input.quizId }, include: { questions: true } });
      if (!quiz) throw new TRPCError({ code: 'NOT_FOUND', message: 'Quiz not found' });

      const total = quiz.questions.length || 1;
      let correct = 0;
      for (const q of quiz.questions) {
        if (q.answer && input.answers[q.id] && input.answers[q.id] === q.answer) correct++;
      }
      const score = Math.round((correct / total) * 100);
      const status = score >= 80 ? ('PASSED' as const) : ('FAILED' as const);

      const submission = await ctx.db.submission.create({
        data: {
          userId,
          quizId: quiz.id,
          answers: JSON.stringify(input.answers),
          status: status as any,
          score,
        },
      });
      return { id: submission.id, status, score };
    }),
});


