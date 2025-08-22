/**
 * Minimal CSRF guard: allow same-origin/same-site via Sec-Fetch-Site or Origin/Referer.
 * Also supports optional double-submit cookie if header `x-csrf-token` matches cookie `csrf`.
 */
export function isCsrfSafe(req: Request): boolean {
  if (process.env.NODE_ENV === 'test') return true;
  const method = req.method?.toUpperCase();
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH' && method !== 'DELETE') return true;
  const secFetchSite = req.headers.get('sec-fetch-site') || '';
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') return true;
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const url = new URL(req.url);
  if (origin && origin === `${url.protocol}//${url.host}`) return true;
  if (referer && referer.startsWith(`${url.protocol}//${url.host}`)) return true;
  // Optional double-submit
  const cookie = req.headers.get('cookie') || '';
  const match = /(?:^|;\s*)csrf=([^;]+)/.exec(cookie);
  const cookieToken = match?.[1];
  const headerToken = req.headers.get('x-csrf-token') || undefined;
  if (cookieToken && headerToken && cookieToken === headerToken) return true;
  return false;
}


