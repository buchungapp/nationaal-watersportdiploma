import * as api from '@nawadi/api'
import * as authenticationHandlers from '../authentication-handlers/index.js'
import * as operationHandlers from '../operation-handlers/index.js'
import { Authentication } from './authentication.js'

export type Server = api.Server<Authentication>

export function createApplicationServer() {
  const server = new api.Server<Authentication>()

  // authentication

  server.registerApiKeyAuthentication(authenticationHandlers.apiToken)
  server.registerTokenAuthentication(authenticationHandlers.token)

  // operations

  // TODO this should be setup more scalable and less error prone
  // see https://github.com/LuvDaSun/OpenApi42/issues/59

  server.registerMeOperation(operationHandlers.me)

  server.registerGetProgramsOperation(operationHandlers.getPrograms)

  server.registerGetLocationsOperation(operationHandlers.getLocations)
  server.registerCreateLocationOperation(operationHandlers.createLocation)

  server.registerGetLocationCohortsOperation(
    operationHandlers.getLocationCohorts,
  )
  server.registerCreateLocationCohortOperation(
    operationHandlers.createLocationCohort,
  )

  server.registerGetLocationCertificatesOperation(
    operationHandlers.getLocationCertificates,
  )
  server.registerCreateLocationCertificateOperation(
    operationHandlers.createLocationCertificate,
  )

  // middleware!

  server.registerMiddleware(api.createErrorMiddleware())

  return server
}
