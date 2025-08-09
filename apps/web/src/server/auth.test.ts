import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeCredentials } from './auth';

vi.mock('./db', () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('bcryptjs', async () => {
  return {
    compare: vi.fn(async (pw: string, hash: string) => pw === 'good' && hash === 'hashed') as any,
  };
});

const { db } = await import('./db');

describe('authorizeCredentials', () => {
  beforeEach(() => {
    (db.user.findUnique as any).mockReset();
  });

  it('returns null when user not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    const res = await authorizeCredentials('a@b.com', 'good');
    expect(res).toBeNull();
  });

  it('returns null when password mismatch', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'LEARNER', passwordHash: 'hashed' });
    const res = await authorizeCredentials('a@b.com', 'bad');
    expect(res).toBeNull();
  });

  it('returns user when password matches', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'LEARNER', passwordHash: 'hashed' });
    const res = await authorizeCredentials('a@b.com', 'good');
    expect(res).toMatchObject({ id: 'u1', email: 'a@b.com', role: 'LEARNER' });
  });
});


