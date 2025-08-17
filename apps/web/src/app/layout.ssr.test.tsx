import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../styles/globals.css', () => ({}), { virtual: true });

describe('RootLayout SSR', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders Login/Sign up when not authenticated', async () => {
    vi.mock('@/server/session', () => ({
      getCurrentSession: vi.fn(async () => null),
    }));
    const Layout = (await import('./layout')).default as (p: { children: React.ReactNode }) => Promise<JSX.Element>;
    const jsx = await Layout({ children: React.createElement('div', null, 'child') });
    const html = renderToString(jsx);
    expect(html).toContain('Login');
    expect(html).toContain('Sign up');
    expect(html).not.toContain('Sign out');
  });

  it('renders Logged in + Sign out when authenticated', async () => {
    vi.mock('@/server/session', () => ({
      getCurrentSession: vi.fn(async () => ({ user: { id: 'u1', email: 'a@b.com' }, expires: new Date().toISOString() })),
    }));
    const Layout = (await import('./layout')).default as (p: { children: React.ReactNode }) => Promise<JSX.Element>;
    const jsx = await Layout({ children: React.createElement('div', null, 'child') });
    const html = renderToString(jsx);
    expect(html).toContain('Logged in as a@b.com');
    expect(html).toContain('Sign out');
  });
});


