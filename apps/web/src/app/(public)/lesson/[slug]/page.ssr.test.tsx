import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { renderToString } from 'react-dom/server';

vi.mock('@/server/trpcClient', () => ({
  getServerTrpcCaller: async () => ({
    lesson: {
      get: async () => ({ title: 'Intro to Git', contentMd: '# Git Basics' }),
      attempts: async () => [],
    },
  }),
}));

describe('LessonPage SSR', () => {
  beforeEach(() => vi.resetModules());

  it('renders lesson title and Mark complete button', async () => {
    const Page = (await import('./page')).default as (p: { params: { slug: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { slug: 'intro-to-git' } });
    const html = renderToString(jsx);
    expect(html).toContain('Intro to Git');
    expect(html.toLowerCase()).toContain('mark complete');
  }, 15000);

  it('renders fallback content when API errors', async () => {
    vi.doMock('@/server/trpcClient', () => ({
      getServerTrpcCaller: async () => ({
        lesson: {
          get: async () => { throw new Error('boom'); },
          attempts: async () => [],
        },
      }),
    }));
    const Page = (await import('./page')).default as (p: { params: { slug: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { slug: 'ts-basics' } });
    const html = renderToString(jsx);
    expect(html).toContain('TS Basics');
  }, 15000);
});


