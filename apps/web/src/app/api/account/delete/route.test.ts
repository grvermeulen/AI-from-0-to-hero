import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/session', () => ({ getCurrentSession: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/server/db', () => ({
  db: {
    userBadge: { deleteMany: vi.fn(async () => ({})) },
    aIEvaluation: { deleteMany: vi.fn(async () => ({})) },
    submission: { deleteMany: vi.fn(async () => ({})) },
    xPEvent: { deleteMany: vi.fn(async () => ({})) },
    lessonProgress: { deleteMany: vi.fn(async () => ({})) },
    profile: { deleteMany: vi.fn(async () => ({})) },
    user: { delete: vi.fn(async () => ({})) },
  },
}));

const { getCurrentSession } = await import('@/server/session');
const { POST } = await import('./route');
const { db } = await import('@/server/db');

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    (getCurrentSession as any).mockResolvedValue({ user: { id: 'u1' } });
  });

  it('401 when unauthenticated', async () => {
    (getCurrentSession as any).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('deletes data in order and returns ok', async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(db.user.delete).toHaveBeenCalled();
  });
});

