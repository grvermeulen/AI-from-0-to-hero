import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { POST } = await import('./route');

function makeReq(body: any, headers: Record<string, string> = {}) {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('http://localhost/api/agent/ingest', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers } as any,
    body: json,
  } as any);
}

describe('POST /api/agent/ingest', () => {
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

  it('rejects invalid signature in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CURSOR_AGENT_WEBHOOK_SECRET', 's');
    const req = makeReq({ x: 1 }, { 'x-agent-signature-256': 'sha256=bad', 'x-github-event': 'issues', 'x-github-delivery': '1' });
    const res = await POST(req as any);
    expect((res as any).status).toBe(401);
  });

  it('accepts without secret in non-production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('CURSOR_AGENT_WEBHOOK_SECRET', '');
    const req = makeReq({ x: 1 }, { 'x-agent-signature-256': '', 'x-github-event': 'issues', 'x-github-delivery': '2' });
    const res = await POST(req as any);
    const json = await (res as any).json();
    expect(json.ok).toBe(true);
    expect(typeof json.stored).toBe('string');
  });

  it('400 on invalid JSON', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const req = makeReq('{bad json', { 'x-agent-signature-256': '', 'x-github-event': 'issues', 'x-github-delivery': '3' });
    const res = await POST(req as any);
    expect((res as any).status).toBe(400);
  });
});


