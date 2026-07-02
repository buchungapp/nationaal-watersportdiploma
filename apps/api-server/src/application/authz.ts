import * as core from "@nawadi/core";
import type { Authentication } from "./authentication.js";

type UserBoundApiKeyActorType = "location_admin" | "instructor" | "student";

export async function userBoundApiKeyHasPrivilegeForLocation(
  authentication: Partial<Authentication>,
  input: {
    privilegeHandle: string;
    locationId: string;
    actorTypes?: [UserBoundApiKeyActorType, ...UserBoundApiKeyActorType[]];
  },
) {
  if (authentication.apiKey == null) {
    return false;
  }

  return core.ApiKey.userBoundApiKeyHasPrivilegeForLocation({
    apiKeyId: authentication.apiKey.apiKey,
    privilegeHandle: input.privilegeHandle,
    locationId: input.locationId,
    actorTypes: input.actorTypes,
  });
}
