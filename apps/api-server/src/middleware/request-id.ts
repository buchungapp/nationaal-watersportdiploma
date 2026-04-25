import { createMiddleware } from "hono/factory";
import { randomUUID } from "node:crypto";
import type { Env } from "../types.js";

export const requestId = createMiddleware<Env>(async (c, next) => {
  const id = c.req.header("x-request-id") ?? randomUUID();
  c.set("requestId", id);
  c.set("startedAt", Date.now());
  c.header("x-request-id", id);
  await next();
});
