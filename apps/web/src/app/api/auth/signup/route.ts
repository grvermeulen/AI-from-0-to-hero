import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/server/rateLimit';
import { createLogger, getRequestId } from '@/server/logger';

function wantsJson(req: Request): boolean {
  const accept = req.headers.get('accept') || '';
  const contentType = req.headers.get('content-type') || '';
  const url = new URL(req.url);
  return (
    accept.includes('application/json') ||
    contentType.includes('application/json') ||
    url.searchParams.get('format') === 'json'
  );
}

export async function POST(req: Request) {
  try {
    const requestId = getRequestId(req);
    const log = createLogger({ requestId });
    // Rate limit by client IP for signup
    const ip = getClientIp(req);
    const rl = checkRateLimit({ key: `signup:${ip}`, limit: 10, windowMs: 5 * 60 * 1000 }) as { allowed: boolean; retryAfter?: number } | undefined;
    if (rl && !rl.allowed) {
      if (wantsJson(req)) {
        log.warn({ code: 'RATE_LIMITED', ip }, 'Signup rate limited');
        return NextResponse.json(
          { code: 'RATE_LIMITED', message: 'Too many signup attempts. Please retry later.', requestId },
          { status: 429, headers: rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : undefined },
        );
      } else {
        const res = NextResponse.redirect(new URL('/signup?error=rate_limited', req.url));
        if (rl?.retryAfter) res.headers.set('Retry-After', String(rl.retryAfter));
        return res;
      }
    }

    const form = await req.formData();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!email || !password) {
      log.warn({ code: 'MISSING' }, 'Missing email or password');
      if (wantsJson(req)) {
        return NextResponse.json({ code: 'MISSING', message: 'Email and password are required.', requestId }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/signup?error=missing', req.url));
    }

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
      const isEmail = parsed.error.issues.some((i) => (i.path?.[0] as string | undefined) === 'email');
      const jsonCode = isEmail ? 'INVALID_EMAIL' : 'WEAK_PASSWORD';
      if (wantsJson(req)) {
        const message = isEmail ? 'Invalid email address.' : 'Password must include upper, lower, number, and special character.';
        log.warn({ code: jsonCode }, 'Validation error');
        return NextResponse.json({ code: jsonCode, message, requestId }, { status: 400 });
      }
      // Map to existing redirect codes to keep UX stable
      const code = isEmail ? 'invalid_email' : 'weak_password';
      return NextResponse.redirect(new URL(`/signup?error=${code}`, req.url));
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      if (wantsJson(req)) {
        log.info({ code: 'EXISTS' }, 'Duplicate email');
        return NextResponse.json({ code: 'EXISTS', message: 'An account with this email already exists.', requestId }, { status: 409 });
      }
      return NextResponse.redirect(new URL('/signup?error=exists', req.url));
    }
    const passwordHash = await hash(password, 10);
    await db.user.create({ data: { email, passwordHash, role: Role.LEARNER } });
    // Redirect to custom login with a friendly flag
    if (wantsJson(req)) {
      log.info({ code: 'CREATED' }, 'User created');
      return NextResponse.json({ code: 'CREATED', message: 'Account created. Please log in.', requestId }, { status: 201 });
    }
    return NextResponse.redirect(new URL('/login?signup=1', req.url));
  } catch (err) {
    const requestId = getRequestId(req);
    const log = createLogger({ requestId });
    log.error({ code: 'SERVER_ERROR', err }, 'Signup server error');
    if (wantsJson(req)) {
      return NextResponse.json({ code: 'SERVER', message: 'Unexpected server error.', requestId }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/signup?error=server', req.url));
  }
}


