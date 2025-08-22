import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/db', () => ({ db: { $queryRaw: vi.fn(async () => 1) } }));

const { GET } = await import('./route');
const { db } = await import('@/server/db');

describe('GET /api/health', () => {
  it('returns ok and db=true when query succeeds', async () => {
    (db.$queryRaw as any).mockResolvedValue(1);
    const res = await GET();
    const json = await (res as any).json();
    expect(json.ok).toBe(true);
    expect(json.db).toBe(true);
  });

  it('returns db=false when query fails', async () => {
    (db.$queryRaw as any).mockRejectedValue(new Error('fail'));
    const res = await GET();
    const json = await (res as any).json();
    expect(json.db).toBe(false);
  });
});

