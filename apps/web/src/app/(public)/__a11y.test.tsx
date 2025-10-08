import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PromptWidget from '@/components/PromptWidget';

expect.extend(toHaveNoViolations);

describe('Accessibility smoke tests', () => {
  it('PromptWidget has no critical a11y violations', async () => {
    render(<PromptWidget initialPrompt="Test" />);
    const region = await screen.findByRole('region', { hidden: true });
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
