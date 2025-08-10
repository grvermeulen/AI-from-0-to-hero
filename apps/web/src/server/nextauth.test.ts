import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions, authorizeCredentials } from './auth';

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
    compare: vi.fn(async (pw: string, hash: string) => pw === 'pw' && hash === 'hashed') as any,
  };
});

const { db } = await import('./db');

describe('NextAuth authorize and callbacks', () => {
  beforeEach(() => {
    (db.user.findUnique as any).mockReset();
  });

  it('credentials authorize calls our authorize function', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'LEARNER', passwordHash: 'hashed' });
    const provider = (authOptions.providers as any)[0];
    const user = await provider.options.authorize({ email: 'a@b.com', password: 'pw' });
    expect(user).toMatchObject({ id: 'u1', email: 'a@b.com', role: 'LEARNER' });
  });

  it('jwt callback adds role when user present', async () => {
    const token = await authOptions.callbacks!.jwt!({ token: { sub: 'u1' } as any, user: { role: 'ADMIN' } as any } as any);
    expect((token as any).role).toBe('ADMIN');
  });

  it('session callback copies id and role', async () => {
    const session = await authOptions.callbacks!.session!({ session: { user: {} } as any, token: { sub: 'u1', role: 'STAFF' } as any } as any);
    expect((session.user as any).id).toBe('u1');
    expect((session.user as any).role).toBe('STAFF');
  });
});



