import * as api from "nwd-api";
import * as application from "../application/index.js";

export function createEchoViaGetHandler(
  context: application.Context,
): api.EchoViaGetOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const { message } = incomingRequest.parameters;

    await context.pgPool.query(
      `
        insert into echo_messages(message_value)
        values($1);
      `,
      [message],
    );

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
