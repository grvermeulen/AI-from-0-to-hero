import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { renderToString } from 'react-dom/server';

vi.mock('@/server/trpcClient', () => ({
  getServerTrpcCaller: async () => ({
    module: {
      getBySlug: async () => ({
        title: 'Foundation',
        lessons: [{ slug: 'intro-to-git', title: 'Intro to Git' }],
        labs: [{ id: 'lab1', title: 'Initialize a Repo' }],
        quizzes: [{ id: 'q1' }],
      }),
      progressBySlug: async () => ({ slugs: ['intro-to-git'] }),
    },
  }),
}));

describe('ModulePage SSR', () => {
  beforeEach(() => vi.resetModules());

  it('renders module details and completion tick', async () => {
    const Page = (await import('./page')).default as (p: { params: { slug: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { slug: 'foundation' } });
    const html = renderToString(jsx);
    expect(html).toContain('Foundation');
    expect(html).toContain('Intro to Git');
    expect(html).toContain('Start Quiz');
  }, 15000);
});

