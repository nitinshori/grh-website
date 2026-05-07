/**
 * In-memory token-bucket rate limiter. Keyed per (action, identifier).
 *
 * Good enough for a single Vercel region under modest traffic. For
 * multi-region or high-traffic deployments, swap for an Upstash/Redis
 * implementation that shares state across edge instances.
 */

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodic cleanup of expired buckets to avoid unbounded growth
let lastSweep = Date.now()
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

function maybeSweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key)
  }
  lastSweep = now
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetIn: number // ms until window resets
}

/**
 * Returns { ok: false } when the caller has exceeded `max` requests in the
 * current `windowMs` window.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  maybeSweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, resetIn: windowMs }
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetIn: bucket.resetAt - now }
  }

  bucket.count += 1
  return {
    ok: true,
    remaining: max - bucket.count,
    resetIn: bucket.resetAt - now,
  }
}
