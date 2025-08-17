import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, resolveDbUserIdFromSession } from '@/server/trpc';
import { offlineMode } from '@/server/env';

export const quizRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (offlineMode()) {
        // Dev stub
        const stub = {
          id: input.quizId,
          title: 'Sample Quiz',
          questions: [
            { id: 'q1', kind: 'MC', prompt: '2 + 2 = ?', options: JSON.stringify(['3', '4', '5']) },
            { id: 'q2', kind: 'MC', prompt: 'Capital of France?', options: JSON.stringify(['Paris', 'Rome', 'Berlin']) },
          ],
        } as any;
        return { id: stub.id, title: stub.title, questions: stub.questions };
      }
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
      const userId = await resolveDbUserIdFromSession(ctx);
      if (offlineMode()) {
        const stubQuestions = [
          { id: 'q1', answer: '4' },
          { id: 'q2', answer: 'Paris' },
        ];
        const total = stubQuestions.length || 1;
        let correct = 0;
        for (const q of stubQuestions) {
          if (q.answer && input.answers[q.id] && input.answers[q.id] === q.answer) correct++;
        }
        const score = Math.round((correct / total) * 100);
        const status = score >= 80 ? ('PASSED' as const) : ('FAILED' as const);
        return { id: 'stub-submission', status, score };
      }
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
      try {
        await ctx.db.xPEvent.create({ data: { userId, kind: 'quiz_submit' as any, amount: 10 } });
        if (status === 'PASSED') {
          await ctx.db.xPEvent.create({ data: { userId, kind: 'quiz_pass' as any, amount: 25 } });
        }
      } catch {}
      return { id: submission.id, status, score };
    }),
});


