import { createMiddleware } from "hono/factory";
import type { Env } from "../types.js";

// Routes whose request body carries PII never persist the partner's
// payload — the audit row gets a sentinel object instead.
const PII_REDACTED_PATHS = new Set(["/v1/persons/lookup"]);
const MUTATING = new Set(["POST", "PATCH", "PUT"]);

export const bodyCapture = createMiddleware<Env>(async (c, next) => {
  if (MUTATING.has(c.req.method)) {
    const path = new URL(c.req.url).pathname;
    if (PII_REDACTED_PATHS.has(path)) {
      c.set("requestBody", { __redacted: "pii" });
    } else {
      try {
        const cloned = c.req.raw.clone();
        const text = await cloned.text();
        if (text.length > 0) {
          try {
            c.set("requestBody", JSON.parse(text));
          } catch {
            c.set("requestBody", { __raw: text.slice(0, 1024) });
          }
        }
      } catch {
        // Body unreadable (already consumed, missing, etc.) — skip.
      }
    }
  }
  await next();
});

export function isPiiRedactedPath(path: string): boolean {
  return PII_REDACTED_PATHS.has(path);
}
