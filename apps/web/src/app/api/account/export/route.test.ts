import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/session', () => ({ getCurrentSession: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/server/db', () => ({
  db: {
    user: { findUnique: vi.fn(async () => ({ id: 'u1', email: 'a@b.com', role: 'LEARNER', createdAt: new Date() })) },
    profile: { findUnique: vi.fn(async () => ({ id: 'p1', userId: 'u1', displayName: 'A' })) },
    submission: { findMany: vi.fn(async () => [{ id: 's1' }]) },
    xPEvent: { findMany: vi.fn(async () => [{ id: 'x1' }]) },
    userBadge: { findMany: vi.fn(async () => [{ id: 'ub1', badge: { id: 'b1', slug: 'first-lesson' } }]) },
  },
}));

const { getCurrentSession } = await import('@/server/session');
const { GET } = await import('./route');

describe('GET /api/account/export', () => {
  beforeEach(() => {
    (getCurrentSession as any).mockResolvedValue({ user: { id: 'u1' } });
  });

  it('401 when unauthenticated', async () => {
    (getCurrentSession as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns user data bundle', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await (res as any).json();
    expect(json.user?.id).toBe('u1');
    expect(Array.isArray(json.submissions)).toBe(true);
  });
});


