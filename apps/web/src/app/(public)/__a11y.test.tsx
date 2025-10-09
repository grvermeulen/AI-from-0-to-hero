import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import PromptWidget from '@/components/PromptWidget';

// vitest-axe types don't include matchers; assert violations length

describe('Accessibility smoke tests', () => {
  it('PromptWidget has no critical a11y violations', async () => {
    render(<PromptWidget initialPrompt="Test" />);
    const region = await screen.findByRole('region', { hidden: true });
    const results = await axe(document.body);
    expect(results.violations.length).toBe(0);
  });
});
