import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";

export const getLocationCohorts: api.server.GetLocationCohortsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey } = incomingRequest.parameters;

  // TODO list cohorts

  return {
    status: 200,
    parameters: {},
    contentType: "application/json",
    entity: () => [
      {
        id: "",
        handle: "",
        title: "",
      },
      {
        id: "",
        handle: "",
        title: "",
      },
    ],
  };
};

export const createLocationCohort: api.server.CreateLocationCohortOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) =>
  core.withTransaction(async () => {
    const { locationKey } = incomingRequest.parameters;
    const entity = await incomingRequest.entity();

    // TODO create cohort

    return {
      status: 201,
      parameters: {},
      contentType: "application/json",
      entity: () => ({
        id: "",
      }),
    };
  });
