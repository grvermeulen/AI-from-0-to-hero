import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkCompleteButton from './MarkCompleteButton';

describe('MarkCompleteButton', () => {
  it('calls action and persists slug, then disables', async () => {
    const action = vi.fn(async () => {});
    render(<MarkCompleteButton slug="intro-to-git" action={action} />);
    const btn = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(btn);
    expect(action).toHaveBeenCalled();
    await Promise.resolve();
    expect(window.localStorage.getItem('completed_lessons')).toContain('intro-to-git');
    expect(btn).toBeDisabled();
  });
});


