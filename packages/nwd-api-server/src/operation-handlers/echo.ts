import * as api from "nwd-api";
import * as application from "../application/index.js";

export function createEchoHandler(
  context: application.Context,
): api.EchoOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const entity = await incomingRequest.entity();

    await context.pgPool.query(
      `
        insert into echo_messages(message_value)
        values($1);
      `,
      [entity.message],
    );

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
