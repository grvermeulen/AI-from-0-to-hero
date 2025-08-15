import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/server/rateLimit';

export async function POST(req: Request) {
  try {
    // Rate limit by client IP for signup
    const ip = getClientIp(req);
    const rl = checkRateLimit({ key: `signup:${ip}`, limit: 10, windowMs: 5 * 60 * 1000 });
    if (!rl.allowed) {
      const res = NextResponse.redirect(new URL('/signup?error=rate_limited', req.url));
      if (rl.retryAfter) res.headers.set('Retry-After', String(rl.retryAfter));
      return res;
    }
    const form = await req.formData();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!email || !password)
      return NextResponse.redirect(new URL('/signup?error=missing', req.url));

    // Robust validation via Zod
    const PasswordSchema = z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'uppercase')
      .regex(/[a-z]/, 'lowercase')
      .regex(/[0-9]/, 'number')
      .regex(/[^A-Za-z0-9]/, 'special');
    const parsed = z
      .object({ email: z.string().email(), password: PasswordSchema })
      .safeParse({ email, password });
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message);
      // Map to existing redirect codes to keep UX stable
      const code = issues.includes('email') ? 'invalid_email' : 'weak_password';
      return NextResponse.redirect(new URL(`/signup?error=${code}`, req.url));
    }
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.redirect(new URL('/signup?error=exists', req.url));
    const passwordHash = await hash(password, 10);
    await db.user.create({ data: { email, passwordHash, role: Role.LEARNER } });
    // Redirect to custom login with a friendly flag
    return NextResponse.redirect(new URL('/login?signup=1', req.url));
  } catch {
    return NextResponse.redirect(new URL('/signup?error=server', req.url));
  }
}


