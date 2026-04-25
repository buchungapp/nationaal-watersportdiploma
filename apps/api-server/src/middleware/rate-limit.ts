import { createMiddleware } from "hono/factory";
import { getRateLimiter } from "../lib/upstash.js";
import { waitUntil } from "../lib/wait-until.js";
import type { Env } from "../types.js";

// Sliding-window 60/min keyed on oauth_client.id (set by `requireAuth`).
// On Upstash Redis via REST → safe across multiple Fluid Compute
// instances. If env vars are missing (e.g. local dev / CI) the limiter
// silently no-ops so the API still works without an account.
export const rateLimit = createMiddleware<Env>(async (c, next) => {
  const client = c.get("client");
  if (!client) {
    await next();
    return;
  }

  const limiter = getRateLimiter();
  if (!limiter) {
    await next();
    return;
  }

  const result = await limiter.limit(client.oauthClientId);

  c.header("x-ratelimit-limit", result.limit.toString());
  c.header("x-ratelimit-remaining", Math.max(0, result.remaining).toString());
  c.header("x-ratelimit-reset", Math.floor(result.reset / 1000).toString());

  if (!result.success) {
    return c.json(
      {
        error: "rate_limited",
        message: "Too many requests",
        requestId: c.get("requestId"),
      },
      429,
    );
  }

  // `pending` resolves after analytics flush — push it off the response
  // path so the partner doesn't pay for our telemetry.
  if (result.pending) {
    waitUntil(result.pending);
  }

  await next();
});
