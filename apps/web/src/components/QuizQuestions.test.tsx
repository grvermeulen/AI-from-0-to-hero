import { describe, it, expect } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render, screen, fireEvent } from '@testing-library/react';
import QuizQuestions from './QuizQuestions';

describe('QuizQuestions', () => {
  it('renders options and records selection', () => {
    const q = [{ id: 'q1', prompt: 'Pick one', options: JSON.stringify(['A','B']) }];
    render(<QuizQuestions quizId="quiz1" questions={q as any} />);
    const a = screen.getByLabelText('A');
    fireEvent.click(a);
    expect((a as HTMLInputElement).checked).toBe(true);
  });
});
