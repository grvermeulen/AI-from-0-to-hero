import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizQuestions from './QuizQuestions';

describe('QuizQuestions', () => {
  it('renders options and stores answers in localStorage', async () => {
    const q = [{ id: 'q1', prompt: 'What?', options: '["a","b"]' }];
    render(<QuizQuestions quizId="seed-quiz-1" questions={q as any} />);
    const radioA = screen.getByLabelText('a');
    await userEvent.click(radioA);
    expect(window.localStorage.getItem('quiz_seed-quiz-1_q1')).toBe('a');
  });
});


