import type { Authentication } from "../application/authentication.js";
import { NwdApiError } from "./error.js";

/**
 * Resolves the final location ID based on token restrictions and path parameter.
 * This function handles the common pattern of determining which location ID to use
 * when a token might be restricted to a specific location.
 *
 * @param pathLocationId - The location ID from the path parameter
 * @param token - The authentication token containing potential location restrictions
 * @returns The resolved location ID
 * @throws NwdApiError if the location ID is invalid or access is forbidden
 */
export function resolveLocationIdOrThrow(
  pathLocationId: string | undefined,
  token: Authentication["token"],
): string {
  const finalLocationId = token.restrictedToLocationId
    ? pathLocationId && pathLocationId !== token.restrictedToLocationId
      ? (() => {
          throw new NwdApiError({
            code: "forbidden",
            message: "Forbidden: You are not allowed to access this location.",
          });
        })()
      : token.restrictedToLocationId
    : pathLocationId;

  if (!finalLocationId) {
    throw new NwdApiError({
      code: "bad_request",
      message:
        "Bad Request: Location ID is required in either the path or the token.",
    });
  }

  return finalLocationId;
}
