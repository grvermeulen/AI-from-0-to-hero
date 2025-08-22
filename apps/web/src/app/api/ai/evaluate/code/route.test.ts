import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/server/session', () => ({
  getCurrentSession: vi.fn(async () => ({ user: { id: 'u1' } })),
}));

vi.mock('@/server/db', () => ({
  db: {
    submission: { create: vi.fn() },
    aIEvaluation: { create: vi.fn() },
  },
}));

vi.mock('@/server/xp', () => ({
  recordXpEvent: vi.fn(async () => undefined),
}));

const { getCurrentSession } = await import('@/server/session');
const { db } = await import('@/server/db');
const { recordXpEvent } = await import('@/server/xp');
const { POST } = await import('./route');

describe('POST /api/ai/evaluate/code', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    (getCurrentSession as any).mockResolvedValue({ user: { id: 'u1' } });
    vi.stubEnv('DATABASE_URL', '');
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in env)) delete (process.env as any)[key];
    }
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') vi.stubEnv(k, v);
    }
  });

  it('401 when unauthenticated', async () => {
    (getCurrentSession as any).mockResolvedValue(null);
    const req = new Request('http://localhost/api/ai/evaluate/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'test("x",()=>{})' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('400 on bad body', async () => {
    const req = new Request('http://localhost/api/ai/evaluate/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('offline: returns score/feedback without persistence', async () => {
    const req = new Request('http://localhost/api/ai/evaluate/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'describe("s",()=>{ it("t",()=>{ expect(1).toBe(1) }) })' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.offline).toBe(true);
    expect(json.persisted).toBe(false);
    expect(typeof json.score).toBe('number');
  });

  it('persists and awards XP when passing and DB available', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://demo');
    (db.submission.create as any).mockResolvedValue({ id: 's1' });
    (db.aIEvaluation.create as any).mockResolvedValue({ id: 'e1' });

    const req = new Request('http://localhost/api/ai/evaluate/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'describe("s",()=>{ it("t",()=>{ expect(1).toBe(1) }) })' }),
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.persisted).toBe(true);
    expect(json.submissionId).toBe('s1');
    expect(recordXpEvent).toHaveBeenCalled();
  });

  it('returns persisted=false when DB write fails', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://demo');
    (db.submission.create as any).mockRejectedValue(new Error('fail'));
    const req = new Request('http://localhost/api/ai/evaluate/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'describe("s",()=>{ it("t",()=>{ expect(1).toBe(1) }) })' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.persisted).toBe(false);
    expect(json.error).toBe('PERSIST_FAILED');
  });
});


