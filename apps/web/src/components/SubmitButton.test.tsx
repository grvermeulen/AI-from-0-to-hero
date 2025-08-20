import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, screen, cleanup } from '@testing-library/react';
import SubmitButton from './SubmitButton';

let mockPending = false;
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return { ...actual, useFormStatus: () => ({ pending: mockPending }) } as any;
});

describe('SubmitButton', () => {
  afterEach(() => cleanup());
  it('renders children when not pending', () => {
    mockPending = false;
    render(<SubmitButton>Send</SubmitButton>);
    const btn = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows Submitting… and is disabled when pending', () => {
    mockPending = true;
    render(<SubmitButton>Send</SubmitButton>);
    const btn = screen.getByRole('button', { name: /submitting/i });
    expect((btn.textContent || '').toLowerCase()).toContain('submitting');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
