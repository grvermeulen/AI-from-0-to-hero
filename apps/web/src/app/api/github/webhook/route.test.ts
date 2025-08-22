import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { POST } = await import('./route');

function makeReq(body: any, headers: Record<string, string> = {}) {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('http://localhost/api/github/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers } as any,
    body: json,
  } as any);
}

describe('POST /api/github/webhook', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    for (const key of Object.keys(process.env)) {
      if (!(key in env)) delete (process.env as any)[key];
    }
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') vi.stubEnv(k, v);
    }
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in env)) delete (process.env as any)[key];
    }
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') vi.stubEnv(k, v);
    }
  });

  it('accepts ping without forwarding', async () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', '');
    const req = makeReq({ zen: 'Keep it logically awesome.' }, {
      'x-github-event': 'ping',
      'x-github-delivery': '1',
      'x-hub-signature-256': '',
    });
    const res = await POST(req as any);
    const json = await (res as any).json();
    expect(json.pong).toBe(true);
  });

  it('rejects invalid signature when secret set', async () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', 'secret');
    const req = makeReq({ a: 1 }, { 'x-github-event': 'issues', 'x-github-delivery': '2', 'x-hub-signature-256': 'sha256=bad' });
    const res = await POST(req as any);
    expect((res as any).status).toBe(401);
  });

  it('forwards allowed event and returns ok', async () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', '');
    vi.stubEnv('CURSOR_AGENT_WEBHOOK_URL', 'http://localhost:9999/api/agent/ingest');
    // Mock global fetch for forwarding
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ status: 200 } as any);
    const req = makeReq({ action: 'opened' }, {
      'x-github-event': 'issues',
      'x-github-delivery': '3',
      'x-hub-signature-256': '',
    });
    const res = await POST(req as any);
    const json = await (res as any).json();
    expect(json.ok).toBe(true);
    expect(json.forward.forwarded).toBe(true);
    fetchSpy.mockRestore();
  });

  it('ignores disallowed events but returns ok', async () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', '');
    const req = makeReq({ any: 'x' }, { 'x-github-event': 'release', 'x-github-delivery': '4', 'x-hub-signature-256': '' });
    const res = await POST(req as any);
    const json = await (res as any).json();
    expect(json.ok).toBe(true);
    expect(json.ignored).toBe(true);
  });
});


