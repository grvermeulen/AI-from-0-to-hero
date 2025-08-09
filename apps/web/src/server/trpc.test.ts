import { describe, it, expect } from 'vitest';
import { appRouter } from './routers/_app';

describe('protectedProcedure via router', () => {
  it('denies access to lesson.complete without session', async () => {
    const caller = appRouter.createCaller({ session: null } as any);
    // Expect calling a protected mutation to throw
    await expect(
      caller.lesson.complete({ lessonId: 'x' })
    ).rejects.toThrowError();
  });
});


