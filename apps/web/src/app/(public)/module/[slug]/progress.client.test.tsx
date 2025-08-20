import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, cleanup } from '@testing-library/react';
import ClientProgressSync from './progress.client';

describe('ClientProgressSync', () => {
  afterEach(() => cleanup());
  it('seeds localStorage and emits event on lesson-completed', () => {
    render(<ClientProgressSync initialSlugs={["s1"]} />);
    expect(window.localStorage.getItem('completed_lessons') || '').toContain('s1');
    const listener = vi.fn();
    window.addEventListener('progress-updated', listener);
    window.dispatchEvent(new CustomEvent('lesson-completed'));
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('progress-updated', listener);
  });
});


