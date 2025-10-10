import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
(globalThis as any).React = React;
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import LessonPage from './[slug]/page';

// toHaveNoViolations matcher is not typed in vitest-axe; compare violations length instead

describe('Lesson page accessibility', () => {
  beforeEach(() => {
    // no-op for now
  });
  afterEach(() => {
    // no-op for now
  });

  it('has no detectable a11y violations for sample content', async () => {
    const Comp = (await import('./[slug]/page')).default as any;
    const jsx = await Comp({ params: { slug: 'intro-to-git' } });
    const { container } = render(jsx);
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  }, 20000);
});
