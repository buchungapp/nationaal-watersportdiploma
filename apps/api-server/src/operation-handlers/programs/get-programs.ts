import * as api from '@nawadi/api'
import { listPrograms } from '@nawadi/core'
import * as application from '../../application/index.js'

export const getPrograms: api.GetProgramsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const programsEntity = listPrograms()

  return {
    status: 200,
    parameters: {},
    contentType: 'application/json',
    entity: () => programsEntity,
  }
}
