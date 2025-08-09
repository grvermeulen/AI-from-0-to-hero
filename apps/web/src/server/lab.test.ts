import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      lab: { findUnique: vi.fn() },
      submission: { create: vi.fn(async ({ data }: any) => ({ id: 's1', ...data })) },
    },
  };
});

const { db } = await import('./db');

describe('labRouter', () => {
  beforeEach(() => {
    (db.lab.findUnique as any).mockReset();
  });

  it('start returns lab', async () => {
    (db.lab.findUnique as any).mockResolvedValue({ id: 'l1', title: 'Lab' });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.lab.start({ labId: 'l1' });
    expect(res.id).toBe('l1');
  });

  it('submit returns pending', async () => {
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.lab.submit({ labId: 'l1', repoUrl: 'https://example.com/repo.git' });
    expect(res.status).toBe('PENDING');
  });
});


