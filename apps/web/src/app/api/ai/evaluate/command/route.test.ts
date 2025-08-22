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

describe('POST /api/ai/evaluate/command', () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    // default: authenticated
    (getCurrentSession as any).mockResolvedValue({ user: { id: 'u1' } });
    vi.stubEnv('DATABASE_URL', '');
  });

  afterEach(() => {
    // restore env variables modified during tests
    for (const key of Object.keys(process.env)) {
      if (!(key in env)) delete (process.env as any)[key];
    }
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') vi.stubEnv(k, v);
    }
  });

  it('returns 401 when unauthenticated', async () => {
    (getCurrentSession as any).mockResolvedValue(null);
    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: 'git init' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('returns 400 on bad request body', async () => {
    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}), // missing input
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('offline mode: evaluates without persistence and passes for intro-to-git', async () => {
    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonSlug: 'intro-to-git', input: 'git init\ngit add .\ngit commit -m "init"' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.persisted).toBe(false);
    expect(json.offline).toBe(true);
    expect(json.pass).toBe(true);
    expect(json.score).toBe(100);
  });

  it('offline mode: partial credit for generic commands', async () => {
    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: 'npm run build' }),
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.persisted).toBe(false);
    expect(typeof json.score).toBe('number');
    expect(json.pass).toBe(false);
  });

  it('persists result and awards XP when DATABASE_URL is set and pass=true', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://demo');
    (db.submission.create as any).mockResolvedValue({ id: 's1' });
    (db.aIEvaluation.create as any).mockResolvedValue({ id: 'e1' });

    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonSlug: 'intro-to-git', input: 'git init\ngit add .\ngit commit -m "init"' }),
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.persisted).toBe(true);
    expect(json.submissionId).toBe('s1');
    expect(db.submission.create).toHaveBeenCalled();
    expect(db.aIEvaluation.create).toHaveBeenCalled();
    expect(recordXpEvent).toHaveBeenCalled();
  });

  it('returns persisted=false when DB write fails', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://demo');
    (db.submission.create as any).mockRejectedValue(new Error('fail'));
    const req = new Request('http://localhost/api/ai/evaluate/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonSlug: 'intro-to-git', input: 'git init\ngit add .\ngit commit -m "init"' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.persisted).toBe(false);
    expect(json.error).toBe('PERSIST_FAILED');
  });
});


