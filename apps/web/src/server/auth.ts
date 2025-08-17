import NextAuth, { type NextAuthOptions, getServerSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';
import { offlineMode } from './env';
import { z } from 'zod';

function devFallbackUser(email: string, password: string) {
  const devEmail = process.env.DEV_AUTH_EMAIL;
  const devPassword = process.env.DEV_AUTH_PASSWORD;
  if (!devEmail || !devPassword) return null;
  if (process.env.NODE_ENV === 'production') return null;
  const match = email === devEmail && password === devPassword;
  if (!match) return null;
  return { id: 'dev-user', email, role: 'LEARNER' as const } as any;
}

export async function authorizeCredentials(email: string, password: string) {
  // Fast dev fallback in explicit offline mode or when env creds set and not production
  if (offlineMode()) {
    const u = devFallbackUser(email, password);
    if (u) return u;
  }
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await compare(password, user.passwordHash);
    if (!ok) return null;
    return { id: user.id, email: user.email, role: user.role } as any;
  } catch (e) {
    const u = devFallbackUser(email, password);
    if (u) return u;
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Email/Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (creds) => {
        const parsed = z
          .object({ email: z.string().min(1), password: z.string().min(1) })
          .safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        return authorizeCredentials(email, password);
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};

export const { auth: unstable_auth } = NextAuth(authOptions);
export const getSession = () => getServerSession(authOptions);


