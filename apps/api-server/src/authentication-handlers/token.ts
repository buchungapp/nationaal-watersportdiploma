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
      const token = await core.ApiKey.byToken(apiKey).catch(() => {
        throw new NwdApiError({
          code: "unauthorized",
          message: "Unauthorized: Invalid API key.",
        });
      });

      return {
        authMechanism: apiKey.startsWith("nwd_access_token_")
          ? "oauth_token"
          : "api_key",
        userId: token.userId,
        restrictedToLocationId: token.locationId,
      };
    }

    const { data, error } = await core.useSupabaseClient().auth.getUser(apiKey);

    if (error) {
      throw new NwdApiError({
        code: "unauthorized",
        message: "Unauthorized: Invalid JWT token.",
      });
    }

    return {
      authMechanism: "jwt",
      userId: data.user.id,
      restrictedToLocationId: null,
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
