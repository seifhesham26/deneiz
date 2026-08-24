/**
 * PROTOTYPE: fixed-window limiter kept in process memory. Upstash takes over
 * by replacing the store below once Redis credentials exist — call sites stay
 * unchanged because they only see check()/hit().
 */

interface Bucket {
  windowStart: number;
  hits: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, hits: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  bucket.hits += 1;
  return {
    allowed: bucket.hits <= limit,
    remaining: Math.max(0, limit - bucket.hits),
  };
}
