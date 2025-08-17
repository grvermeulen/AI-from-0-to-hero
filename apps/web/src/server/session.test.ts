import { describe, it, expect, vi, beforeEach } from 'vitest';

// Path is relative to this test file which sits next to session.ts and auth.ts
describe('getCurrentSession()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.skip('uses unstable_auth when available', async () => {
    vi.mock('@/server/auth', () => ({
      __esModule: true,
      unstable_auth: async () => ({ user: { id: 'u1', email: 'a@b.com' }, expires: new Date().toISOString() }),
      getSession: undefined,
    }));
    const { getCurrentSession } = await import('./session');
    const s = await getCurrentSession();
    expect(s?.user?.id).toBe('u1');
  });

  it.skip('falls back to getSession if unstable_auth is missing', async () => {
    vi.mock('@/server/auth', () => ({
      __esModule: true,
      unstable_auth: undefined,
      getSession: async () => ({ user: { id: 'u2', email: 'b@c.com' }, expires: new Date().toISOString() }),
    }));
    const { getCurrentSession } = await import('./session');
    const s = await getCurrentSession();
    expect(s?.user?.id).toBe('u2');
  });

  it('returns null when no API is available', async () => {
    vi.mock('@/server/auth', () => ({ __esModule: true, unstable_auth: undefined, getSession: undefined }));
    const { getCurrentSession } = await import('./session');
    const s = await getCurrentSession();
    expect(s).toBeNull();
  });
});


