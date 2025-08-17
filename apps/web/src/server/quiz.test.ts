import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      quiz: { findUnique: vi.fn() },
      submission: { create: vi.fn(async ({ data }: any) => ({ id: 's1', ...data })) },
      xPEvent: { create: vi.fn(async (args: any) => ({ id: 'xp1', ...args.data })) },
    },
  };
});

const { db } = await import('./db');

describe('quizRouter', () => {
  beforeEach(() => {
    (db.quiz.findUnique as any).mockReset();
  });

  it('start hides answers', async () => {
    (db.quiz.findUnique as any).mockResolvedValue({ id: 'q1', title: 'T', questions: [{ id: 'q', kind: 'mc', prompt: 'P', options: '[]', answer: 'a' }] });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.quiz.start({ quizId: 'q1' });
    expect((res as any).questions[0].answer).toBeUndefined();
  });

  it('submit computes score and saves submission (db path)', async () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://local/test';
    (db.quiz.findUnique as any).mockResolvedValue({ id: 'q1', title: 'T', questions: [
      { id: 'q1', answer: 'a' },
      { id: 'q2', answer: 'b' },
    ] });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.quiz.submit({ quizId: 'q1', answers: { q1: 'a', q2: 'b' } });
    expect(res.status).toBe('PASSED');
    expect(res.score).toBe(100);
    if (!original) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = original;
  });

  it('submit passes at 80% threshold and records XP events', async () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://local/test';
    (db.quiz.findUnique as any).mockResolvedValue({ id: 'qT', title: 'T', questions: [
      { id: 'q1', answer: 'a' },
      { id: 'q2', answer: 'b' },
      { id: 'q3', answer: 'c' },
      { id: 'q4', answer: 'd' },
      { id: 'q5', answer: 'e' },
    ] });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.quiz.submit({ quizId: 'qT', answers: { q1: 'a', q2: 'b', q3: 'c', q4: 'd' } });
    expect(res.status).toBe('PASSED'); // 4/5 = 80%
    expect(res.score).toBe(80);
    expect(db.xPEvent.create).toHaveBeenCalledWith({ data: { userId: 'u1', kind: 'quiz_submit', amount: 10 } });
    expect(db.xPEvent.create).toHaveBeenCalledWith({ data: { userId: 'u1', kind: 'quiz_pass', amount: 25 } });
    if (!original) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = original;
  });

  it('submit computes score with dev stub when DB is not configured', async () => {
    const originalDb = process.env.DATABASE_URL;
    const originalOffline = process.env.OFFLINE_MODE;
    delete process.env.DATABASE_URL;
    process.env.OFFLINE_MODE = '1';
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.quiz.submit({ quizId: 'any', answers: { q1: '4', q2: 'Paris' } });
    expect(res.status).toBe('PASSED');
    expect(res.score).toBe(100);
    if (originalDb) process.env.DATABASE_URL = originalDb; else delete process.env.DATABASE_URL;
    if (originalOffline) process.env.OFFLINE_MODE = originalOffline; else delete process.env.OFFLINE_MODE;
  });
});


