type RateLimitBucket = {
  windowStart: number;
  hits: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { windowStart: now, hits: 1 });
    return { allowed: true };
  }
  const elapsed = now - bucket.windowStart;
  if (elapsed > windowMs) {
    // Reset window
    bucket.windowStart = now;
    bucket.hits = 1;
    return { allowed: true };
  }
  bucket.hits += 1;
  if (bucket.hits <= limit) return { allowed: true };
  const retryAfterMs = windowMs - elapsed;
  return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
}

export function getClientIp(req: Request): string {
  // Best-effort IP extraction
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '127.0.0.1';
}


