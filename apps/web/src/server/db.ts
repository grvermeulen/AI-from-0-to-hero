import pkg from '@prisma/client';
const { PrismaClient } = pkg as unknown as { PrismaClient: typeof import('@prisma/client').PrismaClient };

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? (['query', 'warn', 'error'] as const)
        : (['error'] as const),
  });

export const db: PrismaClient = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;


