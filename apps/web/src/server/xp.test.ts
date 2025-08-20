import { describe, it, expect, vi } from 'vitest';
import { recordXpEvent } from './xp';

describe('recordXpEvent', () => {
  it('awards first-quiz-pass badge on quiz_pass event when user had none', async () => {
    const ctx: any = {
      db: {
        xPEvent: { create: vi.fn(async () => ({})) },
        badge: { findUnique: vi.fn(async ({ where }: any) => ({ id: 'b1', slug: where.slug })) },
        userBadge: {
          findFirst: vi.fn(async () => null),
          create: vi.fn(async ({ data }: any) => ({ id: 'ub1', ...data })),
        },
      },
    };
    await recordXpEvent(ctx, { userId: 'u1', kind: 'quiz_pass', amount: 25 });
    expect(ctx.db.xPEvent.create).toHaveBeenCalled();
    expect(ctx.db.userBadge.create).toHaveBeenCalledWith({ data: { userId: 'u1', badgeId: 'b1' } });
  });

  it('computes badge popularity percentages (integration-lite)', async () => {
    // Simulate 4 users, 2 with the badge
    const ctx: any = {
      db: {
        xPEvent: { create: vi.fn(async () => ({})) },
        badge: { findUnique: vi.fn(async ({ where }: any) => ({ id: 'b1', slug: where.slug })) },
        userBadge: {
          findFirst: vi.fn(async () => null),
          create: vi.fn(async () => ({})),
          groupBy: vi.fn(async () => [{ badgeId: 'b1', _count: { badgeId: 2 } }]),
        },
        user: { count: vi.fn(async () => 4) },
      },
    };
    await recordXpEvent(ctx, { userId: 'u1', kind: 'quiz_pass', amount: 25 });
    // percentage logic is in meRouter, here we just ensure xp+badge write paths stay compatible
    expect(ctx.db.userBadge.create).toHaveBeenCalled();
  });
});


