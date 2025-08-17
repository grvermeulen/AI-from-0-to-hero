import { initTRPC, TRPCError } from '@trpc/server';
import { offlineMode, dbConfigured } from './env';
import superjson from 'superjson';
import type { Session } from 'next-auth';
import { db as prisma } from './db';

export type TRPCContext = {
  session: Session | null;
  db: typeof prisma;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  let session: TRPCContext['session'] = null;
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
  // Dev fallback: when offline mode, allow a synthetic session
  if (!ctx.session?.user) {
    if (offlineMode()) {
      const fakeSession: Session = {
        user: { id: 'dev-user', name: 'Dev User', email: 'dev@example.com', role: 'LEARNER' },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      return next({ ctx: { ...ctx, session: fakeSession } });
    }
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = ctx.session?.user?.role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

// Resolve a database-backed user id from the session. In dev DB mode, a previously
// cached synthetic session (id "dev-user") can linger after switching to a real DB.
// We bridge that by looking up the user id by email when needed.
export async function resolveDbUserIdFromSession(ctx: TRPCContext): Promise<string> {
  const user = ctx.session?.user;
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  let userId: string | undefined = user.id;
  if (dbConfigured() && (!userId || userId === 'dev-user')) {
    const email = user.email || undefined;
    if (email) {
      const found = await ctx.db.user.findUnique({ where: { email } }).catch(() => null);
      if (found) userId = found.id;
    }
  }
  if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return userId;
}

