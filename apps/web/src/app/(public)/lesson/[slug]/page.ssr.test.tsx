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

  it('shows completion toast from cookie and renders attempts list', async () => {
    vi.doMock('next/headers', () => ({
      cookies: () => ({ get: (k: string) => (k === 'completed_lessons' ? { value: 'intro-to-git' } : undefined) }),
    }));
    vi.doMock('@/server/trpcClient', () => ({
      getServerTrpcCaller: async () => ({
        lesson: {
          get: async () => ({ title: 'Intro to Git', contentMd: '# Git Basics' }),
          attempts: async () => ([
            { id: '1', createdAt: new Date('2024-01-01').toISOString(), status: 'PASSED', score: 100, feedback: 'Well done' },
            { id: '2', createdAt: new Date('2024-01-02').toISOString(), status: 'FAILED', score: 20, feedback: null },
            { id: '3', createdAt: new Date('2024-01-03').toISOString(), status: 'PENDING', score: null, feedback: null },
          ]),
        },
      }),
    }));
    const Page = (await import('./page')).default as (p: { params: { slug: string } }) => Promise<JSX.Element>;
    const jsx = await Page({ params: { slug: 'intro-to-git' } });
    const html = renderToString(jsx);
    expect(html).toContain('Marked as complete');
    expect(html).toContain('Recent Attempts');
    expect(html).toContain('PASSED');
    expect(html).toContain('FAILED');
    expect(html).toContain('PENDING');
  }, 15000);
});


