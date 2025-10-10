import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

// Assert on violations length instead of custom matcher

describe('A11y smoke tests', () => {
  it('PromptWidget has no obvious a11y violations', async () => {
    const PromptWidget = (await import('@/components/PromptWidget')).default;
    const { container } = render(React.createElement(PromptWidget, { initialPrompt: 'test' }));
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  });
});
