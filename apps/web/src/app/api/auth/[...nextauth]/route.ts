import NextAuth from 'next-auth';
import { authOptions } from '@/server/auth';
import { checkRateLimit } from '@/server/rateLimit';

const handler = async (req: Request, ctx?: unknown) => {
  if (req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rl = checkRateLimit({ key: `login:${ip}`, limit: 20, windowMs: 5 * 60 * 1000 });
    if (!rl.allowed) {
      return new Response(null, { status: 429, headers: rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : undefined });
    }
  }
  // Delegate to NextAuth handler
  const nextAuthHandler = NextAuth(authOptions);
  return (nextAuthHandler as unknown as (req: Request, ctx?: unknown) => Promise<Response>)(req, ctx);
};
export { handler as GET, handler as POST };


