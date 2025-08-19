import { db } from '@/server/db';

export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  return Response.json({ ok: true, ts: new Date().toISOString(), db: dbOk });
}

