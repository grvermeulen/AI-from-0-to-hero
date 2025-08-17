import type { Session } from 'next-auth';
import { unstable_auth as maybeAuth, getSession as maybeGetSession } from '@/server/auth';

export async function getCurrentSession(): Promise<Session | null> {
  if (typeof maybeAuth === 'function') {
    try {
      return await maybeAuth();
    } catch {}
  }
  if (typeof maybeGetSession === 'function') {
    try {
      return await maybeGetSession();
    } catch {}
  }
  return null;
}


