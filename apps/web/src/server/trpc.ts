import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export type TRPCContext = Record<string, never>;

export async function createTRPCContext(): Promise<TRPCContext> {
  return {};
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

