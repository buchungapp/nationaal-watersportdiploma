import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../../application/index.js";

export function echo(
  context: application.Context,
): api.EchoOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const entity = await incomingRequest.entity();
    const { message } = entity;

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
