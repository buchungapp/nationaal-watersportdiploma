import * as api from "nwd-api";
import * as application from "../application/index.js";

export function createEchoHandler(): api.EchoOperationHandler<application.ServerAuthentication> {
  return async (incomingRequest, authentication) => {
    const entity = await incomingRequest.entity();

    return {
      status: 200,
      parameters: {},
      contentType: "application/json",
      entity: () => ({
        message: entity.message,
      }),
    };
  };
}
