import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      track: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

const { db } = await import('./db');

describe('trackRouter.list', () => {
  beforeEach(() => {
    (db.track.findMany as any).mockReset();
    (db.track.count as any).mockReset();
  });

  it('lists paginated tracks', async () => {
    (db.track.findMany as any).mockResolvedValue([
      { id: 't1', slug: 'foundation', name: 'Foundation', phase: 'FOUNDATION', order: 1 },
    ]);
    (db.track.count as any).mockResolvedValue(1);

    const caller = appRouter.createCaller({ session: null, db } as any);
    const res = await caller.track.list({ page: 1, pageSize: 10 });
    expect(res.total).toBe(1);
    expect(res.items[0].slug).toBe('foundation');
  });
});


