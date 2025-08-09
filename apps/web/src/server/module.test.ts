import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      track: { findUnique: vi.fn() },
      module: { findMany: vi.fn(), count: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    },
  };
});

const { db } = await import('./db');

describe('moduleRouter', () => {
  beforeEach(() => {
    (db.track.findUnique as any).mockReset();
    (db.module.findMany as any).mockReset();
    (db.module.count as any).mockReset();
    (db.module.upsert as any).mockReset();
    (db.module.delete as any).mockReset();
  });

  it('lists modules by track', async () => {
    (db.track.findUnique as any).mockResolvedValue({ id: 't1' });
    (db.module.findMany as any).mockResolvedValue([{ id: 'm1', slug: 'git-basics', title: 'Git Basics', trackId: 't1' }]);
    (db.module.count as any).mockResolvedValue(1);
    const caller = appRouter.createCaller({ session: null, db } as any);
    const res = await caller.module.listByTrack({ trackSlug: 'foundation', page: 1, pageSize: 10 });
    expect(res.total).toBe(1);
    expect(res.items[0].slug).toBe('git-basics');
  });

  it('upserts a module', async () => {
    (db.track.findUnique as any).mockResolvedValue({ id: 't1' });
    (db.module.upsert as any).mockResolvedValue({ id: 'm1', slug: 'git-basics' });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'ADMIN' } }, db } as any);
    const res = await caller.module.upsert({ slug: 'git-basics', title: 'Git Basics', trackSlug: 'foundation', order: 1 });
    expect(res.slug).toBe('git-basics');
  });

  it('deletes a module', async () => {
    (db.module.delete as any).mockResolvedValue({ id: 'm1' });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'STAFF' } }, db } as any);
    const res = await caller.module.delete({ slug: 'git-basics' });
    expect(res.ok).toBe(true);
  });
});


