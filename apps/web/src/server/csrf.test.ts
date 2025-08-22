import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { isCsrfSafe } from './csrf';

function makeReq(init: RequestInit & { url?: string } = {}) {
  const url = init.url || 'https://example.com/api/test';
  return new Request(url, { method: 'POST', ...init } as any);
}

describe('isCsrfSafe', () => {
  const env = process.env.NODE_ENV;
  // Ensure not short-circuiting in tests
  beforeAll(() => { vi.stubEnv('NODE_ENV', 'production'); });
  afterAll(() => { vi.stubEnv('NODE_ENV', env ?? ''); });

  it('allows same-site via Sec-Fetch-Site', () => {
    const req = makeReq({ headers: new Headers({ 'sec-fetch-site': 'same-site' }) });
    expect(isCsrfSafe(req)).toBe(true);
  });

  it('allows matching origin', () => {
    const req = makeReq({ headers: new Headers({ origin: 'https://example.com' }) });
    expect(isCsrfSafe(req)).toBe(true);
  });

  it('allows double-submit match', () => {
    const req = makeReq({ headers: new Headers({ cookie: 'csrf=abc', 'x-csrf-token': 'abc' }) });
    expect(isCsrfSafe(req)).toBe(true);
  });

  it('blocks cross-site without token', () => {
    const req = makeReq({ headers: new Headers({ origin: 'https://evil.com' }) });
    expect(isCsrfSafe(req)).toBe(false);
  });
});


