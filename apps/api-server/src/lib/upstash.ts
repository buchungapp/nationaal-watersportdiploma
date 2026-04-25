import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let cachedRedis: Redis | null = null;
let cachedLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (cachedRedis) return cachedRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

// Sliding-window 60 req / 60s per oauth client.
// REST transport is intentional: avoids TCP pool exhaustion on
// short-lived Fluid Compute invocations.
export function getRateLimiter(): Ratelimit | null {
  if (cachedLimiter) return cachedLimiter;

  const redis = getRedis();
  if (!redis) return null;

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    analytics: true,
    prefix: "nwd-api:ratelimit",
    timeout: 1_000,
  });
  return cachedLimiter;
}
