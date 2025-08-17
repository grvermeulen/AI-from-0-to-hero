import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/server/rateLimit', async () => {
  return {
    checkRateLimit: vi.fn(() => ({ allowed: false, retryAfter: 60 })),
  };
});

describe('POST /api/auth/[...nextauth] (rate limit)', () => {
  it('returns 429 when login is rate limited', async () => {
    const req = new Request('http://localhost/api/auth/[...nextauth]', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });
});


