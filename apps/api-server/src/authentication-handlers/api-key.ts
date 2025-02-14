import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";

export const apiKey: api.server.ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  const apiKeyItem = await core.ApiKey.byToken(token);

  if (apiKeyItem == null) {
    return;
  }

  return {
    apiKey: apiKeyItem.id,
    user: apiKeyItem.userId,
  };
};
