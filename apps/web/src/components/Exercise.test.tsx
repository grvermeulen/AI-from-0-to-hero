import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CommandExercise, CodeExercise } from './Exercise';

// Minimal fetch mock
beforeEach(() => {
  vi.restoreAllMocks();
  // Ensure React is available globally for classic JSX transform in tests
  // @ts-expect-error attach for test env
  globalThis.React = React;
  // @ts-expect-error override global
  global.fetch = vi.fn(async (url: string, init?: any) => {
    if (String(url).includes('/api/ai/evaluate/command')) {
      return new Response(JSON.stringify({ score: 100, pass: true, feedback: 'ok', offline: true, persisted: false }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url).includes('/api/ai/evaluate/code')) {
      return new Response(JSON.stringify({ score: 60, pass: false, feedback: 'needs tests', offline: true, persisted: false }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  });
});

afterEach(() => {
  cleanup();
});

describe('CommandExercise', () => {
  it('submits and shows score/feedback', async () => {
    render(<CommandExercise lessonSlug="intro-to-git" title="Commands" />);
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    await waitFor(() => screen.getByText(/Score:/));
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });
});

describe('CodeExercise', () => {
  it('submits and renders feedback', async () => {
    render(<CodeExercise lessonSlug="intro-to-git" title="Code" />);
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    await waitFor(() => screen.getByText(/Score:/));
    expect(screen.getByText(/needs tests/)).toBeInTheDocument();
  });
});


