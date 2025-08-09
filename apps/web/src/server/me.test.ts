import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      xPEvent: { findMany: vi.fn(async () => [{ amount: 10 }, { amount: 5 }]) },
      userBadge: { count: vi.fn(async () => 2) },
      submission: {
        count: vi.fn(async ({ where }: any) => {
          return where.status === 'PASSED' ? 3 : where.status === 'FAILED' ? 1 : 2;
        }),
      },
    },
  };
});

const { db } = await import('./db');

describe('meRouter.progress', () => {
  it('returns xp, badges and submission counts', async () => {
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.me.progress();
    expect(res.xpTotal).toBe(15);
    expect(res.badgesCount).toBe(2);
    expect(res.submissions.passed).toBe(3);
  });
});


