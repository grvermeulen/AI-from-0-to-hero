import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers/_app';

vi.mock('./db', () => {
  return {
    db: {
      quiz: { findUnique: vi.fn() },
      submission: { create: vi.fn(async ({ data }: any) => ({ id: 's1', ...data })) },
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

  it('submit computes score and saves submission', async () => {
    (db.quiz.findUnique as any).mockResolvedValue({ id: 'q1', title: 'T', questions: [
      { id: 'q1', answer: 'a' },
      { id: 'q2', answer: 'b' },
    ] });
    const caller = appRouter.createCaller({ session: { user: { id: 'u1', role: 'LEARNER' } }, db } as any);
    const res = await caller.quiz.submit({ quizId: 'q1', answers: { q1: 'a', q2: 'b' } });
    expect(res.status).toBe('PASSED');
    expect(res.score).toBe(100);
  });
});


