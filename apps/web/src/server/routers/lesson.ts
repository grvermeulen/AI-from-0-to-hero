import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const lessonRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      return { slug: input.slug, title: 'Placeholder Lesson', contentMd: '# Hello' };
    }),
});

