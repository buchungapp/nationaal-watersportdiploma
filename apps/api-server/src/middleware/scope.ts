import { Auth } from "@nawadi/core";
import { createMiddleware } from "hono/factory";
import type { Env } from "../types.js";

type PublicApiScope = Auth.PublicApiScope;

// Per-route scope gate. Runs before request validation and the handler,
// so a token missing the scope never touches the DB. Pair with
// `requireAuth` mounted on the same path; if `client` is unset here,
// auth wasn't applied and we surface that as a server error rather
// than silently 403.
export const withRequiredScope = (scope: PublicApiScope) =>
  createMiddleware<Env>(async (c, next) => {
    const client = c.get("client");
    if (!client) {
      return c.json(
        {
          error: "internal_error",
          message: "Auth context missing — scope middleware misconfigured",
          requestId: c.get("requestId"),
        },
        500,
      );
    }

    if (!client.scopes.includes(scope)) {
      return c.json(
        {
          error: "insufficient_scope",
          message: `Missing required scope: ${scope}. Token has: ${
            client.scopes.join(", ") || "(none)"
          }`,
          requestId: c.get("requestId"),
        },
        403,
      );
    }

    await next();
  });
