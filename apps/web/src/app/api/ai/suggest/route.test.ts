import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/server/ai', () => ({ suggestDraftForPrompt: async (p: string) => `Idea for: ${p}` }));
vi.mock('@/server/rateLimit', () => ({
  checkRateLimit: () => ({ allowed: true }),
  getClientIp: () => '127.0.0.1',
}));

describe('ai/suggest POST', () => {
  it('returns suggestion', async () => {
    const req = new Request('https://x/api/ai/suggest', { method: 'POST', body: JSON.stringify({ prompt: 'abc' }) });
    const res = await POST(req as any);
    const json = await (res as any).json();
    expect(json.suggestion).toContain('abc');
  });

  it('validates input', async () => {
    const req = new Request('https://x/api/ai/suggest', { method: 'POST', body: JSON.stringify({ nope: true }) });
    const res = await POST(req as any);
    expect((res as any).status).toBe(400);
  });
});

