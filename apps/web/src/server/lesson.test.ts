import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      lesson: {
        findUnique: vi.fn(),
      },
    },
  };
});

const { db } = await import('./db');

describe('lessonRouter.get', () => {
  beforeEach(() => {
    (db.lesson.findUnique as any).mockReset();
  });

  it('returns lesson when found', async () => {
    (db.lesson.findUnique as any).mockResolvedValue({ id: 'l1', slug: 'intro', title: 'Intro', contentMd: '# Hi' });
    const caller = appRouter.createCaller({ session: null, db } as any);
    const res = await caller.lesson.get({ slug: 'intro' });
    expect(res).toMatchObject({ slug: 'intro', title: 'Intro' });
  });

  it('throws NOT_FOUND when missing', async () => {
    (db.lesson.findUnique as any).mockResolvedValue(null);
    const caller = appRouter.createCaller({ session: null, db } as any);
    await expect(caller.lesson.get({ slug: 'missing' })).rejects.toThrowError();
  });
});


