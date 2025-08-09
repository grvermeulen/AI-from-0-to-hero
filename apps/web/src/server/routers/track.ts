import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc';

export const trackRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const [items, total] = await Promise.all([
        ctx.db.track.findMany({ orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
        ctx.db.track.count(),
      ]);
      return { items, total, page, pageSize };
    }),

  upsert: adminProcedure
    .input(z.object({ id: z.string().optional(), slug: z.string().min(1), name: z.string().min(1), phase: z.enum(['FOUNDATION','AI_AUGMENTED','INTEGRATION','ADVANCED']), order: z.number().int().min(0).default(0) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.track.upsert({
        where: id ? { id } : { slug: input.slug },
        create: data,
        update: data,
      });
      return result;
    }),
});


