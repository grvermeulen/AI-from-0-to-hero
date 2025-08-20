import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { renderToString } from 'react-dom/server';

vi.mock('../../../styles/globals.css', () => ({} as any));

describe('ProfilePage SSR', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders profile headers when data is available', async () => {
    vi.doMock('@/server/trpcClient', () => ({
      getServerTrpcCaller: async () => ({
        me: { progress: async () => ({
          xpTotal: 10, badgesCount: 1, badges: [], submissions: { passed: 0, failed: 0, pending: 0 }, recentSubmissions: [], badgesEarned: [], badgesAvailable: []
        }) },
      }),
    }));
    const Page = (await import('./page')).default as () => Promise<JSX.Element>;
    const html = renderToString(await Page());
    expect(html).toContain('Your Profile');
    expect(html).toContain('Badges');
  }, 15000);

  it('renders login prompt when call fails', async () => {
    vi.doMock('@/server/trpcClient', () => ({
      getServerTrpcCaller: async () => ({ me: { progress: async () => { throw new Error('fail'); } } }),
    }));
    const Page = (await import('./page')).default as () => Promise<JSX.Element>;
    const html = renderToString(await Page());
    expect(html).toContain('Please login');
  }, 15000);
});

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


