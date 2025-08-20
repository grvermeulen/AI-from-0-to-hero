import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, screen, cleanup, act } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  afterEach(() => cleanup());
  it('renders message', () => {
    render(<Toast message="Saved" duration={50} />);
    const el = screen.getByRole('status');
    expect((el.textContent || '').includes('Saved')).toBe(true);
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
