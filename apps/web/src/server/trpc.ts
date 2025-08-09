import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { getSession } from './auth';
import { db as prisma } from './db';

export type TRPCContext = {
  session: Awaited<ReturnType<typeof getSession>>;
  db: typeof prisma;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await getSession();
  return { session, db: prisma };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role as string | undefined;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

