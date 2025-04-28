import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";
import { NwdApiError } from "../lib/error.js";

export const token: api.server.TokenAuthenticationHandler<
  application.Authentication
> = async (authorizationHeader) => {
  let apiKey: string | undefined = undefined;

  try {
    if (!authorizationHeader.includes("Bearer ")) {
      throw new NwdApiError({
        code: "bad_request",
        message:
          "Misconfigured authorization header. Did you forget to add 'Bearer '?",
      });
    }
    apiKey = authorizationHeader.replace("Bearer ", "");

    const isRestrictedToken = apiKey?.startsWith("nwd_");

    if (isRestrictedToken) {
      throw new NwdApiError({
        code: "internal_server_error",
        message: "We don't support restricted tokens yet (oauth).",
      });
    }

    const token = await core.ApiKey.byToken(apiKey);

    return {
      user: token.userId,
    };
  } catch (error) {
    if (error instanceof NwdApiError) {
      throw error;
    }

    throw new NwdApiError({
      code: "internal_server_error",
      message: "Failed to authenticate token.",
    });
  }
};
