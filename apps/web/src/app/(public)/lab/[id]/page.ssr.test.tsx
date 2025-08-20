import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { renderToString } from 'react-dom/server';

vi.mock('@/server/trpcClient', () => ({
  getServerTrpcCaller: async () => ({
    lab: {
      start: async () => ({ id: 'lab1', title: 'Initialize a Repo', description: 'Do X' }),
    },
  }),
}));

describe('LabPage SSR', () => {
  beforeEach(() => vi.resetModules());

  it('renders lab title and submit form', async () => {
    const Page = (await import('./page')).default as (p: { params: { id: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { id: 'lab1' } } as any);
    const html = renderToString(jsx);
    expect(html).toContain('Initialize a Repo');
    expect(html).toContain('Submit');
  }, 15000);

  it('renders fallback when unauthenticated', async () => {
    vi.doMock('@/server/trpcClient', () => ({
      getServerTrpcCaller: async () => ({ lab: { start: async () => { throw new Error('no'); } } }),
    }));
    const Page = (await import('./page')).default as (p: { params: { id: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { id: 'lab1' } } as any);
    const html = renderToString(jsx);
    expect(html).toContain('Please login to access the lab runner.');
  }, 15000);
});


