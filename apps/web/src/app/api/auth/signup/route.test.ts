import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/server/db', () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock('bcryptjs', async () => {
  return {
    hash: vi.fn(async (pw: string) => `hashed:${pw}`) as any,
  };
});

const { db } = await import('@/server/db');

function makeFormRequest(data: Record<string, string>) {
  const body = new URLSearchParams(data);
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    (db.user.findUnique as any).mockReset();
    (db.user.create as any).mockReset();
  });

  it('redirects with error when fields missing', async () => {
    const req = makeFormRequest({ email: '', password: '' });
    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
<<<<<<< HEAD
    expect(res.headers.get('location')).toContain('/signup?error=1');
=======
    expect(res.headers.get('location')).toContain('/signup?error=missing');
>>>>>>> origin/image
  });

  it('redirects with exists when user already exists', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1' });
<<<<<<< HEAD
    const req = makeFormRequest({ email: 'a@b.com', password: 'pw' });
=======
    const req = makeFormRequest({ email: 'a@b.com', password: 'goodpass1' });
>>>>>>> origin/image
    const res = await POST(req);
    expect(res.headers.get('location')).toContain('/signup?error=exists');
    expect(db.user.create).not.toHaveBeenCalled();
  });

<<<<<<< HEAD
  it('creates user and redirects to sign-in on success', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    (db.user.create as any).mockResolvedValue({ id: 'new' });
    const req = makeFormRequest({ email: 'a@b.com', password: 'pw' });
    const res = await POST(req);
    expect(db.user.create).toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('/api/auth/signin');
=======
  it('creates user and redirects to login with success flag on success', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    (db.user.create as any).mockResolvedValue({ id: 'new' });
    const req = makeFormRequest({ email: 'a@b.com', password: 'goodpass1' });
    const res = await POST(req);
    expect(db.user.create).toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('/login?signup=1');
>>>>>>> origin/image
  });
});



