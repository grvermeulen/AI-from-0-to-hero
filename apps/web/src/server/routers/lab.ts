import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, resolveDbUserIdFromSession } from '@/server/trpc';
import { offlineMode } from '@/server/env';
import { SubmissionStatus } from '@prisma/client';
import { recordXpEvent } from '@/server/xp';

function sanitizeCode(input: string): string {
  // Remove control chars except tabs/newlines/carriage returns; trim excessive length
  const cleaned = input.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  return cleaned.length > 10000 ? cleaned.slice(0, 10000) : cleaned;
}

export const labRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ labId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (offlineMode()) {
        return { id: input.labId, title: 'Sample Lab', description: 'Submit a repo URL or code snippet.' };
      }
      const lab = await ctx.db.lab.findUnique({ where: { id: input.labId } });
      if (!lab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lab not found' });
      return lab;
    }),

  submit: protectedProcedure
    .input(
      z
        .object({
          labId: z.string(),
          repoUrl: z.string().url().max(200).optional(),
          code: z.string().max(20000).optional(),
        })
        .refine((v) => Boolean(v.repoUrl || (v.code && v.code.trim().length > 0)), {
          message: 'repoUrl_or_code_required',
          path: ['code'],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveDbUserIdFromSession(ctx);
      if (offlineMode()) {
        return { id: 'stub-submission', status: SubmissionStatus.PENDING };
      }
      // Sanitize and enforce limits
      const codeSanitized = input.code ? sanitizeCode(input.code) : undefined;
      if (codeSanitized && codeSanitized.length > 10000) {
        // Use 413 semantics via custom code in message; tRPC maps to 400. Clients can branch on message/code.
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'PAYLOAD_TOO_LARGE' });
      }
      const created = await ctx.db.submission.create({
        data: {
          userId,
          labId: input.labId,
          repoUrl: input.repoUrl,
          code: codeSanitized,
          status: SubmissionStatus.PENDING,
        },
      });
      await recordXpEvent(ctx, { userId, kind: 'lab_submit', amount: 10 });
      return { id: created.id, status: SubmissionStatus.PENDING };
    }),
});


