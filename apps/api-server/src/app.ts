import { apiReference } from "@scalar/hono-api-reference";
import { Auth } from "@nawadi/core";
import { createOpenAPIApp } from "./lib/openapi-app.js";
import {
  auditLog,
  bodyCapture,
  rateLimit,
  requestId,
  requireAuth,
} from "./middleware/index.js";
import { mountRouters } from "./routes/index.js";

export interface AppOptions {
  issuer?: string;
}

export function createApp(options: AppOptions = {}) {
  const issuer = options.issuer ?? Auth.getAuthBaseUrl();

  const app = createOpenAPIApp();

  // Order matters: request-id must be first so every later middleware can
  // tag logs/audit rows with it. Auth must run before rate-limit because
  // rate-limit keys on `client.oauthClientId`. Body capture sits before
  // auth so even an unauthorized POST gets recorded in the audit log.
  app.use("*", requestId);
  app.use("*", auditLog);
  app.use("/v1/*", bodyCapture);
  app.use("/v1/*", requireAuth(issuer));
  app.use("/v1/*", rateLimit);

  app.get("/health", (c) => c.json({ ok: true }, 200));

  mountRouters(app);

  // OpenAPI document — served under /v1 so partners can mirror their base
  // URL in tools like Postman / Stoplight without juggling two roots.
  app.doc("/v1/openapi.json", {
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

  // Interactive docs UI. Partners hitting /docs in a browser get a Scalar
  // reference rendered straight from the OpenAPI document — no separate
  // build step, no extra hosting.
  app.get(
    "/docs",
    apiReference({
      pageTitle: "NWD Public API",
      spec: { url: "/v1/openapi.json" },
    }),
  );

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

  return app;
}
