// Import PrismaClient in a way that works with ESM and typechecking in CI
// eslint-disable-next-line -- Prisma client import relies on generated types
// @ts-ignore
import { PrismaClient as PrismaClientCtor } from '@prisma/client';
type PrismaClientType = InstanceType<typeof PrismaClientCtor>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined;
}

const createClient = () =>
  new PrismaClientCtor({
    log:
      process.env.NODE_ENV !== 'production'
        ? (['query', 'warn', 'error'] as const)
        : (['error'] as const),
  });

export const db: PrismaClientType = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;


