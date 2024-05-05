import * as api from '@nawadi/api'
import * as authenticationHandlers from '../authentication-handlers/index.js'
import * as operationHandlers from '../operation-handlers/index.js'
import { Authentication } from './authentication.js'

export type Server = api.Server<Authentication>

export function createApplicationServer() {
  const server = new api.Server<Authentication>()

  server.registerAuthentications(authenticationHandlers)
  server.registerOperations(operationHandlers)

  // middleware!

  server.registerMiddleware(api.createErrorMiddleware())

  return server
}
