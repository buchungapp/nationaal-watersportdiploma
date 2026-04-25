import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types.js";

// Shared factory so every sub-router emits the same 400 shape and inherits
// the same `Env` (Variables typing). Keeps the request-id wired into
// validation errors without each router re-declaring the hook.
export function createOpenAPIApp(): OpenAPIHono<Env> {
  return new OpenAPIHono<Env>({
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
}
