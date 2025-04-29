import * as api from "@nawadi/api";
import * as authenticationHandlers from "../authentication-handlers/index.js";
import { NwdApiError, errorCodeToHttpStatus } from "../lib/error.js";
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
      const nwdError = NwdApiError.fromUnknown(error);

      return {
        status: errorCodeToHttpStatus[nwdError.code],
        headers: {
          "content-type": "application/json",
          date: new Date().toISOString(),
        },
        async *stream() {
          yield new TextEncoder().encode(
            JSON.stringify({
              error: { code: nwdError.code, message: nwdError.message },
            }),
          );
        },
      };
    }
  });

  return server;
}
