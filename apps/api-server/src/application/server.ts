import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import * as authenticationHandlers from "../authentication-handlers/index.js";
import * as operationHandlers from "../operation-handlers/index.js";
import type { Authentication } from "./authentication.js";

export type Server = api.server.Server<Authentication>;

export function createApplicationServer() {
  const server = new api.server.Server<Authentication>();

  // authentication

  server.registerApiKeyAuthentication(authenticationHandlers.apiKey);
  server.registerOpenIdAuthentication(authenticationHandlers.openId);

  // operations

  // TODO this should be setup more scalable and less error prone
  // see https://github.com/LuvDaSun/OpenApi42/issues/59

  server.registerMeOperation(operationHandlers.me);

  server.registerListDisciplinesOperation(operationHandlers.listDisciplines);
  server.registerRetrieveDisciplineOperation(
    operationHandlers.retrieveDiscipline,
  );

  server.registerRetrieveCurriculaByDisciplineOperation(
    operationHandlers.retrieveCurriculaByDiscipline,
  );

  server.registerListProgramsOperation(operationHandlers.listPrograms);

  server.registerGetLocationsOperation(operationHandlers.getLocations);
  server.registerCreateLocationOperation(operationHandlers.createLocation);

  server.registerGetLocationCohortsOperation(
    operationHandlers.getLocationCohorts,
  );
  server.registerCreateLocationCohortOperation(
    operationHandlers.createLocationCohort,
  );

  server.registerGetLocationCertificatesOperation(
    operationHandlers.getLocationCertificates,
  );
  server.registerCreateLocationCertificateOperation(
    operationHandlers.createLocationCertificate,
  );

  // middleware!

  server.registerMiddleware(async (req, next) => {
    try {
      return await next(req);
    } catch (error) {
      core.error(error);
      throw error;
    }
  });
  server.registerMiddleware(api.lib.createErrorMiddleware());

  return server;
}
