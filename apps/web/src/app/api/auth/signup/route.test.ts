import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/server/rateLimit', async () => {
  return {
    checkRateLimit: vi.fn(() => ({ allowed: true })),
    getClientIp: vi.fn(() => '127.0.0.1'),
  };
});

vi.mock('bcryptjs', async () => {
  return {
    hash: vi.fn(async (pw: string) => `hashed:${pw}`) as any,
  };
});

const { db } = await import('@/server/db');
const { checkRateLimit } = await import('@/server/rateLimit');
const { POST } = await import('./route');

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
    (checkRateLimit as any).mockReset?.();
  });

  it('redirects with error when fields missing', async () => {
    const req = makeFormRequest({ email: '', password: '' });
    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toContain('/signup?error=missing');
  });

  it('redirects with exists when user already exists', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1' });
    const req = makeFormRequest({ email: 'a@b.com', password: 'Goodpass1!' });
    const res = await POST(req);
    expect(res.headers.get('location')).toContain('/signup?error=exists');
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('creates user and redirects to login with success flag on success', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    (db.user.create as any).mockResolvedValue({ id: 'new' });
    const req = makeFormRequest({ email: 'a@b.com', password: 'Goodpass1!' });
    const res = await POST(req);
    expect(db.user.create).toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('/login?signup=1');
  });

  it('returns 400 JSON for invalid email when Accept: application/json', async () => {
    const req = new Request('http://localhost/api/auth/signup?format=json', {
      method: 'POST',
      body: new URLSearchParams({ email: 'not-an-email', password: 'Goodpass1!' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('INVALID_EMAIL');
    expect(typeof json.requestId).toBe('string');
  });

  it('returns 400 JSON for weak password when Accept: application/json', async () => {
    const req = new Request('http://localhost/api/auth/signup?format=json', {
      method: 'POST',
      body: new URLSearchParams({ email: 'a@b.com', password: 'weakweak' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('WEAK_PASSWORD');
  });

  it('returns 409 JSON for duplicate email when Accept: application/json', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'u1' });
    const req = new Request('http://localhost/api/auth/signup?format=json', {
      method: 'POST',
      body: new URLSearchParams({ email: 'a@b.com', password: 'Goodpass1!' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('EXISTS');
  });

  it('returns 429 JSON when rate limited', async () => {
    (checkRateLimit as any).mockReturnValue({ allowed: false, retryAfter: 42 });
    const req = new Request('http://localhost/api/auth/signup?format=json', {
      method: 'POST',
      body: new URLSearchParams({ email: 'a@b.com', password: 'Goodpass1!' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    const json = await res.json();
    expect(json.code).toBe('RATE_LIMITED');
  });
});



