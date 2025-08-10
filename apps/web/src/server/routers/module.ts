import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc';

export const moduleRouter = createTRPCRouter({
  listByTrack: publicProcedure
    .input(z.object({ trackSlug: z.string().min(1), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      const track = await ctx.db.track.findUnique({ where: { slug: input.trackSlug }, select: { id: true } });
      if (!track) throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        ctx.db.module.findMany({ where: { trackId: track.id }, orderBy: { order: 'asc' }, skip, take: input.pageSize }),
        ctx.db.module.count({ where: { trackId: track.id } }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const mod = await ctx.db.module.findUnique({
        where: { slug: input.slug },
        include: { lessons: { orderBy: { order: 'asc' } }, labs: true, quizzes: true },
      });
      if (!mod) throw new TRPCError({ code: 'NOT_FOUND', message: 'Module not found' });
      return mod;
    }),

  upsert: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      slug: z.string().min(1),
      title: z.string().min(1),
      trackSlug: z.string().min(1),
      order: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const track = await ctx.db.track.findUnique({ where: { slug: input.trackSlug } });
      if (!track) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Track slug does not exist' });
      const { id, trackSlug, ...rest } = input as any;
      const data = { ...rest, trackId: track.id };
      const result = await ctx.db.module.upsert({
        where: id ? { id } : { slug: input.slug },
        create: data,
        update: data,
      });
      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().optional(), slug: z.string().optional() }).refine(v => !!v.id || !!v.slug, 'id or slug is required'))
    .mutation(async ({ ctx, input }) => {
      const where = input.id ? { id: input.id } : { slug: input.slug! };
      const deleted = await ctx.db.module.delete({ where });
      return { ok: true as const, id: deleted.id };
    }),
});


