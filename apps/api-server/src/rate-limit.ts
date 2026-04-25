/**
 * Sliding-window in-memory rate limiter keyed by oauth_client_id.
 * Sufficient for single-instance v1; replace with Redis-backed limiter
 * before horizontal scaling.
 */
const buckets = new Map<string, number[]>();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000,
  max: 60,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {},
): RateLimitResult {
  const merged = { ...DEFAULTS, ...config };
  const now = Date.now();
  const cutoff = now - merged.windowMs;

  const events = buckets.get(key) ?? [];
  const recent = events.filter((ts) => ts > cutoff);
  recent.push(now);
  buckets.set(key, recent);

  if (recent.length > merged.max) {
    const oldest = recent[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldest + merged.windowMs,
    };
  }

  return {
    allowed: true,
    remaining: merged.max - recent.length,
    resetAt: now + merged.windowMs,
  };
}

export function resetRateLimits() {
  buckets.clear();
}
