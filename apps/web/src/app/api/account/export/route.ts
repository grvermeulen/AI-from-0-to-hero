import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/server/session';
import { db } from '@/server/db';

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = session.user.id;
  try {
    const [user, profile, submissions, xpEvents, badges] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, createdAt: true } }),
      db.profile.findUnique({ where: { userId } }),
      db.submission.findMany({ where: { userId } }),
      db.xPEvent.findMany({ where: { userId } }),
      db.userBadge.findMany({ where: { userId }, include: { badge: true } }),
    ]);
    return NextResponse.json({ user, profile, submissions, xpEvents, badges });
  } catch {
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}


