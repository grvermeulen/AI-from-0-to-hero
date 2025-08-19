import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/server/session';
import { db } from '@/server/db';

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const userId = session.user.id;
  try {
    // Order matters due to FKs
    await db.userBadge.deleteMany({ where: { userId } });
    await db.aIEvaluation.deleteMany({ where: { submission: { userId } } });
    await db.submission.deleteMany({ where: { userId } });
    await db.xPEvent.deleteMany({ where: { userId } });
    await db.lessonProgress.deleteMany({ where: { userId } });
    await db.profile.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}


