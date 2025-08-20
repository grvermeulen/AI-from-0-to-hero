import { describe, it, expect, vi } from 'vitest';
import React from 'react';
// Some transforms may require React on global in tests
(globalThis as any).React = React;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkCompleteButton from './MarkCompleteButton';

describe('MarkCompleteButton', () => {
  it('calls action and disables after click', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<MarkCompleteButton slug="intro-to-git" action={action} defaultCompleted={false} />);
    const btn = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(btn);
    await Promise.resolve();
    expect(action).toHaveBeenCalled();
    await waitFor(() => {
      expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
