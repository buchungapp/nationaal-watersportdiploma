import * as api from '@nawadi/api'
import { listPrograms } from '@nawadi/core'
import * as application from '../../application/index.js'

export function getPrograms(): api.GetProgramsOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const programsEntity = listPrograms()

    return {
      status: 200,
      parameters: {},
      contentType: 'application/json',
      entity: () => programsEntity,
    }
  }
}
