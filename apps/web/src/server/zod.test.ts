import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Zod smoke', () => {
  it('validates a simple schema', () => {
    const Schema = z.object({ email: z.string().email(), age: z.number().min(18) });
    const ok = Schema.safeParse({ email: 'a@b.com', age: 20 });
    expect(ok.success).toBe(true);
  });
});

