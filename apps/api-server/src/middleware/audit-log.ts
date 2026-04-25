import { createMiddleware } from "hono/factory";
import { writeAuditLog } from "../audit.js";
import { waitUntil } from "../lib/wait-until.js";
import type { Env } from "../types.js";
import { isPiiRedactedPath } from "./body-capture.js";

// Captures method/path/status/duration into api_audit_log. Body capture
// happens upstream in body-capture middleware; PII routes get a sentinel
// instead of the real payload. Persistence is handed to `waitUntil` so the
// response returns before the row is written, and `writeAuditLog` swallows
// its own errors so a DB hiccup never bubbles up to the partner.
export const auditLog = createMiddleware<Env>(async (c, next) => {
  let errorCode: string | null = null;
  try {
    await next();
  } catch (err) {
    errorCode = err instanceof Error ? err.name : "internal_error";
    throw err;
  } finally {
    const path = new URL(c.req.url).pathname;
    if (path.startsWith("/v1/")) {
      const startedAt = c.get("startedAt") ?? Date.now();
      const client = c.get("client");

      let responseBody: unknown = undefined;
      if (isPiiRedactedPath(path)) {
        responseBody = { __redacted: "pii" };
      } else if (
        c.res &&
        c.res.headers.get("content-type")?.includes("json")
      ) {
        try {
          const cloned = c.res.clone();
          responseBody = await cloned.json();
        } catch {
          responseBody = undefined;
        }
      }

      waitUntil(
        writeAuditLog({
          oauthClientId: client?.oauthClientId ?? null,
          vaarschoolId: client?.vaarschoolId ?? null,
          requestId: c.get("requestId"),
          method: c.req.method,
          path,
          status: c.res?.status ?? 500,
          durationMs: Date.now() - startedAt,
          requestBody: c.get("requestBody"),
          responseBody,
          errorCode,
        }),
      );
    }
  }
});
