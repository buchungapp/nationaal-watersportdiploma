import type * as api from "@nawadi/api";
import type { Authentication } from "../application/authentication.js";

export const healthCheck: api.server.HealthCheckOperationHandler<
  Authentication
> = async () => {
  return { status: "ok" };
};
