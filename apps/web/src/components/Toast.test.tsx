import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, screen, cleanup, act } from '@testing-library/react';
import { configureAxe } from 'vitest-axe';
import Toast from './Toast';

describe('Toast', () => {
  afterEach(() => cleanup());
  it('renders message', () => {
    render(<Toast message="Saved" duration={50} />);
    const el = screen.getByRole('status');
    expect((el.textContent || '').includes('Saved')).toBe(true);
  });

  it('has no obvious a11y violations', async () => {
    const axe = configureAxe({ rules: { region: { enabled: false } } });
    const { container } = render(<Toast message="Saved" duration={10} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('hides after duration elapses', async () => {
    vi.useFakeTimers();
    render(<Toast message="Bye" duration={1} />);
    // initially visible
    expect(screen.getByRole('status')).toBeTruthy();
    // advance timers to trigger close
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });
    expect(screen.queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });
});
