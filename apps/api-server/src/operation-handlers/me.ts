import assert from "node:assert";
import type * as api from "@nawadi/api";
import type * as application from "../application/index.js";

export const me: api.server.MeOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  let id: string | undefined;
  // TODO make this more ergonomic
  if ("apiKey" in authentication && authentication.apiKey != null) {
    id = authentication.apiKey.user;
  }

  // TODO make this more ergonomic
  if ("openId" in authentication && authentication.openId != null) {
    id = authentication.openId.user;
  }

  assert(id != null);

  return {
    status: 200,
    parameters: {},
    contentType: "application/json",
    entity: () => ({
      id,
      handle: "",
    }),
  };
};
