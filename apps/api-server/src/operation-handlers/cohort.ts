import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import slugify from "@sindresorhus/slugify";
import type * as application from "../application/index.js";
import { NwdApiError } from "../lib/error.js";

export const createCohort: api.server.CreateCohortOperationHandler<
  application.Authentication
> = async ({ locationId: pathLocationId }, input, { token }) => {
  const { handle, accessStartTime, accessEndTime, title } = input;

  // Determine the final location ID based on token restrictions and path parameter
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

  const slug = handle ?? slugify(title);
  const cohort = await core.Cohort.create({
    handle: slug,
    accessStartTime,
    accessEndTime,
    label: title,
    locationId: finalLocationId,
  });

  return {
    id: cohort.id,
    handle: slug,
  };
};
