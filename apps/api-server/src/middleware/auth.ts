import { createMiddleware } from "hono/factory";
import { UnauthorizedError, verifyAccessToken } from "../auth.js";
import type { Env } from "../types.js";

export const requireAuth = (issuer: string) =>
  createMiddleware<Env>(async (c, next) => {
    const auth = c.req.header("authorization");
    try {
      const { client } = await verifyAccessToken(auth, { issuer });
      c.set("client", client);
      await next();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
            requestId: c.get("requestId"),
          },
          401,
        );
      }
      throw err;
    }
  });
