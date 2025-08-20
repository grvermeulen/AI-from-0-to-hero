import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
// Some transforms may require React on global in tests
(globalThis as any).React = React;
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import MarkCompleteButton from './MarkCompleteButton';

describe('MarkCompleteButton', () => {
  afterEach(() => cleanup());
  it('calls action and disables after click', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<MarkCompleteButton slug="intro-to-git" action={action} defaultCompleted={false} />);
    const btn = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(btn);
    await Promise.resolve();
    expect(action).toHaveBeenCalled();
    await waitFor(() => {
      const b = screen.getByRole('button') as HTMLButtonElement;
      expect(b.disabled).toBe(true);
      expect(b.title.toLowerCase()).toContain('completed');
      expect(b.textContent?.toLowerCase() || '').toMatch(/completed|working/);
    });
  });

  it('early-returns when already completed', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<div>
      <MarkCompleteButton slug="a" action={action} defaultCompleted={true} />
    </div>);
    const btn = screen.getAllByRole('button', { name: /completed/i })[0] as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    // Clicking should not call action due to early return
    fireEvent.click(btn);
    await Promise.resolve();
    expect(action).not.toHaveBeenCalled();
  });

  it('swallows errors from action and localStorage writes', async () => {
    const action = vi.fn().mockRejectedValue(new Error('nope'));
    const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('ls-fail');
    });
    render(<div>
      <MarkCompleteButton slug="intro-to-git" action={action} defaultCompleted={false} />
    </div>);
    const btn = screen.getAllByRole('button', { name: /mark complete/i })[0];
    fireEvent.click(btn);
    await Promise.resolve();
    // Despite errors, component should transition to completed state
    await waitFor(() => {
      const b = screen.getAllByRole('button')[0] as HTMLButtonElement;
      expect(b.disabled).toBe(true);
    });
    setSpy.mockRestore();
  });
});
