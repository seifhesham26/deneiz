/**
 * PROTOTYPE: fixed-window limiter kept in process memory. Upstash takes over
 * by replacing the store below once Redis credentials exist — call sites stay
 * unchanged because they only see check()/hit().
 */

interface Bucket {
  /** Absolute expiry, not a start time: the sweep has no idea which window the
   *  key was created with, and call sites use different ones (reviews 1h,
   *  order lookup 15m). Deriving expiry from the caller let a lookup sweep
   *  delete review buckets early and reset someone's allowance. */
  expiresAt: number;
  hits: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Buckets were never removed, so the map grew by one entry per distinct IP for
 * the life of the process. Sweeping on write keeps that bounded without a timer
 * (a setInterval would keep a serverless instance alive).
 */
const SWEEP_THRESHOLD = 10_000;

function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    if (buckets.size >= SWEEP_THRESHOLD) sweepExpired(now);
    buckets.set(key, { expiresAt: now + windowMs, hits: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  bucket.hits += 1;
  return {
    allowed: bucket.hits <= limit,
    remaining: Math.max(0, limit - bucket.hits),
  };
}
