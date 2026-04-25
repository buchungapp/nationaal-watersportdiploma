import { OpenAPIHono } from "@hono/zod-openapi";
import { Auth } from "@nawadi/core";
import { randomUUID } from "node:crypto";
import { writeAuditLog } from "./audit.js";
import type { ApiClient } from "./auth.js";
import { checkRateLimit } from "./rate-limit.js";
import { registerRoutes, requireAuth } from "./routes.js";

type Variables = {
  client: ApiClient;
  requestId: string;
  startedAt: number;
  requestBody: unknown;
};

export interface AppOptions {
  issuer?: string;
}

export function createApp(options: AppOptions = {}) {
  const issuer = options.issuer ?? Auth.getAuthBaseUrl();

  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "invalid_request",
            message: result.error.message,
            issues: result.error.issues,
            requestId: c.get("requestId"),
          },
          400,
        );
      }
    },
  });

  // Request ID + start time
  app.use("*", async (c, next) => {
    const requestId = c.req.header("x-request-id") ?? randomUUID();
    c.set("requestId", requestId);
    c.set("startedAt", Date.now());
    c.header("x-request-id", requestId);
    await next();
  });

  // Capture request body for audit (clone so handlers can still read it).
  // Routes that accept PII (e.g. /v1/persons/lookup) are redacted so the
  // audit log never persists the email/name/DOB the partner sent us.
  const PII_REDACTED_PATHS = new Set(["/v1/persons/lookup"]);
  app.use("/v1/*", async (c, next) => {
    const method = c.req.method;
    if (method === "POST" || method === "PATCH" || method === "PUT") {
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
          /* ignore — body can't be cloned in some cases */
        }
      }
    }
    await next();
  });

  // Auth (must run before rate-limit so `client` is set)
  app.use("/v1/*", requireAuth(issuer));

  // Rate limit (per oauth client) — runs after auth middleware sets `client`
  app.use("/v1/*", async (c, next) => {
    const client = c.get("client");
    if (client) {
      const result = checkRateLimit(client.oauthClientId);
      c.header(
        "x-ratelimit-remaining",
        Math.max(0, result.remaining).toString(),
      );
      c.header(
        "x-ratelimit-reset",
        Math.floor(result.resetAt / 1000).toString(),
      );
      if (!result.allowed) {
        return c.json(
          {
            error: "rate_limited",
            message: "Too many requests",
            requestId: c.get("requestId"),
          },
          429,
        );
      }
    }
    await next();
  });

  // Audit log (after handler)
  app.use("*", async (c, next) => {
    let errorCode: string | null = null;
    try {
      await next();
    } catch (err) {
      errorCode = err instanceof Error ? err.name : "internal_error";
      throw err;
    } finally {
      const startedAt = c.get("startedAt") ?? Date.now();
      const client = c.get("client");
      const path = new URL(c.req.url).pathname;
      if (path.startsWith("/v1/")) {
        let responseBody: unknown = undefined;
        if (PII_REDACTED_PATHS.has(path)) {
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
        // Fire-and-forget: don't block response
        void writeAuditLog({
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
        });
      }
    }
  });

  // Health check
  app.get("/health", (c) => c.json({ ok: true }, 200));

  // OpenAPI document
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Nationaal Watersportdiploma Public API",
      version: "1.0.0",
      description:
        "v1 of the public NWD API for partner integrations. Uses OAuth 2.0 client_credentials with audience=https://api.nwd.nl.",
    },
    servers: [{ url: "/" }],
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

  // Global error handler
  app.onError((err, c) => {
    console.error("api-server error:", err);
    return c.json(
      {
        error: "internal_error",
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
        requestId: c.get("requestId"),
      },
      500,
    );
  });

  registerRoutes(app, { issuer });

  return app;
}
