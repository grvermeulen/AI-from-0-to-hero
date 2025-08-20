import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { renderToString } from 'react-dom/server';

vi.mock('../../../styles/globals.css', () => ({} as any));

vi.mock('@/server/trpcClient', () => ({
  getServerTrpcCaller: async () => ({
    me: {
      progress: async () => ({
        xpTotal: 42,
        badgesCount: 1,
        badges: [{ id: 'b1', name: 'First Lesson', icon: '⭐' }],
        submissions: { passed: 1, failed: 0, pending: 0 },
        recentSubmissions: [],
        badgesEarned: [],
        badgesAvailable: [],
      }),
    },
  }),
}));

describe('ProfilePage SSR', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders profile headers', async () => {
    const Page = (await import('./page')).default as () => Promise<JSX.Element>;
    const jsx = await Page();
    const html = renderToString(jsx);
    expect(html).toContain('Your Profile');
    expect(html).toContain('Badges');
  }, 15000);
});


