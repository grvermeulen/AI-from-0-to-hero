import { db } from '@/server/db';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const ts = new Date().toISOString();
  try {
    // Lightweight DB check when configured
    if (process.env.DATABASE_URL) {
      await db.$queryRaw`SELECT 1`;
    }
    return Response.json({ ok: true, ts, db: Boolean(process.env.DATABASE_URL) ? 'up' : 'disabled' });
  } catch (error) {
    Sentry.captureException(error as any);
    return Response.json({ ok: false, ts, db: 'down' }, { status: 503 });
  }
}

