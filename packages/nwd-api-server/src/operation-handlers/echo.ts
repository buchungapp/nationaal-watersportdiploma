import * as api from "nwd-api";
import * as application from "../application/index.js";

export function createEchoHandler(
  context: application.Context,
): api.EchoOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    context.count += 1;

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
