import { describe, it, expect, vi } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, screen } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Saved" duration={50} />);
    const el = screen.getByRole('status');
    expect((el.textContent || '').includes('Saved')).toBe(true);
  });
});
