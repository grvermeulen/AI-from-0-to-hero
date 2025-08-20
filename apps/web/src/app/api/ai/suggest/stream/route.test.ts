import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/server/rateLimit', () => ({
  checkRateLimit: () => ({ allowed: true }),
  getClientIp: () => '127.0.0.1',
}));

describe('ai/suggest/stream GET', () => {
  it('returns 400 without q', async () => {
    const res = await GET(new Request('https://x/api/ai/suggest/stream') as any);
    expect((res as any).status).toBe(400);
  });

  it('streams offline chunks when no OPENAI_API_KEY', async () => {
    const res = await GET(new Request('https://x/api/ai/suggest/stream?q=test') as any);
    const reader = (res as any).body.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain('Draft (offline)');
  });
});


