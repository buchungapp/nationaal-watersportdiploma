import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import * as authenticationHandlers from "../authentication-handlers/index.js";
import * as operationHandlers from "../operation-handlers/index.js";
import type { Authentication } from "./authentication.js";

export type Server = api.server.Server<Authentication>;

export function createApplicationServer() {
  const server = new api.server.Server<Authentication>({});

  // authentication
  server.registerAuthentications(authenticationHandlers);

  // operations

  server.registerOperations(operationHandlers);

  // middleware!

  server.registerMiddleware(async (req, next) => {
    try {
      return await next(req);
    } catch (error) {
      core.error(error);
      throw error;
    }
  });
  server.registerMiddleware(api.lib.createErrorMiddleware());

  return server;
}
