import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!email || !password) return NextResponse.redirect(new URL('/signup?error=1', req.url));
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.redirect(new URL('/signup?error=exists', req.url));
    const passwordHash = await hash(password, 10);
    await db.user.create({ data: { email, passwordHash, role: Role.LEARNER } });
    // Redirect to custom login with a friendly flag
    return NextResponse.redirect(new URL('/login?signup=1', req.url));
  } catch {
    return NextResponse.redirect(new URL('/signup?error=1', req.url));
  }
}


