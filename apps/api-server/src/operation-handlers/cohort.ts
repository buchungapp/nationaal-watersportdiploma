import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import slugify from "@sindresorhus/slugify";
import type * as application from "../application/index.js";
import { NwdApiError } from "../lib/error.js";
import { resolveLocationIdOrThrow } from "../lib/location.js";

export const createCohort: api.server.CreateCohortOperationHandler<
  application.Authentication
> = async ({ locationId: pathLocationId }, input, { token }) => {
  const { handle, accessStartTime, accessEndTime, title } = input;

  const finalLocationId = resolveLocationIdOrThrow(pathLocationId, token);
  const hasPermission = await core.User.Rbac.checkPermissionForPersonInLocation(
    {
      personId: token.primaryPersonId,
      locationId: finalLocationId,
      permission: "cohort.manage",
    },
  );

  if (!hasPermission) {
    throw new NwdApiError({
      code: "forbidden",
      message: "You do not have permission to manage cohorts",
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
