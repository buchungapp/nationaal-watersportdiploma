import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../application/index.js";

export function createEchoViaGetHandler(
  context: application.Context,
): api.EchoViaGetOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const { message } = incomingRequest.parameters;

    await context.db.insert(schema.echoMessages).values({
      messageValue: message,
    });

    return {
      status: 200,
      parameters: {},
      contentType: "application/json",
      entity: () => ({
        message,
      }),
    };
  };
}
