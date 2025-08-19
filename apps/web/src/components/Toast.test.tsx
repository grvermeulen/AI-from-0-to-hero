import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  it('renders message and auto-hides after duration', async () => {
    vi.useFakeTimers();
    render(<Toast message="Saved" duration={1000} />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(screen.queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });
});


