import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { getSession } from './auth';

export type TRPCContext = {
  session: Awaited<ReturnType<typeof getSession>>;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await getSession();
  return { session };
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

