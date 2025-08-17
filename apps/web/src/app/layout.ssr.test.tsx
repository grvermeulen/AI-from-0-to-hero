import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../styles/globals.css', () => ({} as any));

// Hoisted mock uses a mutable factory so each test can control the return value
let sessionFactory: () => Promise<any> = async () => null;
vi.mock('@/server/session', () => ({
  getCurrentSession: () => sessionFactory(),
}));

describe('RootLayout SSR', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders Login/Sign up when not authenticated', async () => {
    sessionFactory = async () => null;
    const Layout = (await import('./layout')).default as (p: { children: React.ReactNode }) => Promise<JSX.Element>;
    const jsx = await Layout({ children: React.createElement('div', null, 'child') });
    const html = renderToString(jsx);
    expect(html).toContain('Login');
    expect(html).toContain('Sign up');
    expect(html).not.toContain('Sign out');
  });

  it('renders Logged in + Sign out when authenticated', async () => {
    sessionFactory = async () => ({ user: { id: 'u1', email: 'a@b.com' }, expires: new Date().toISOString() });
    const Layout = (await import('./layout')).default as (p: { children: React.ReactNode }) => Promise<JSX.Element>;
    const jsx = await Layout({ children: React.createElement('div', null, 'child') });
    const html = renderToString(jsx);
    // React adds a comment boundary around interpolations in SSR; match just the email
    expect(html).toContain('a@b.com');
    expect(html).toContain('Sign out');
  });
});


