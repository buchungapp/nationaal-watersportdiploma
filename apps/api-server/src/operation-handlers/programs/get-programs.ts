import * as api from '@nawadi/api'
import { listPrograms, withTransaction } from '@nawadi/core'
import * as application from '../../application/index.js'

export const getPrograms: api.GetProgramsOperationHandler<
  application.Authentication
> = (incomingRequest, authentication) =>
  withTransaction(async () => {
    const programsEntity = await listPrograms()

    return {
      status: 200,
      parameters: {},
      contentType: 'application/json',
      entity: () => programsEntity,
    }
  })
