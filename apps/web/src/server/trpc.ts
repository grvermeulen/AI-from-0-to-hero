import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session } from 'next-auth';
import { db as prisma } from './db';

export type TRPCContext = {
  session: Session | null;
  db: typeof prisma;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  let session: TRPCContext['session'] = null as any;
  try {
    // Dynamically import auth to avoid hard dependency when not configured yet
    const mod = await import('./auth');
    if (typeof mod.getSession === 'function') {
      session = await mod.getSession();
    }
  } catch {
    // leave session as null
  }
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

