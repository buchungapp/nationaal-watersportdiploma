import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listPrograms: api.ListProgramsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.list()

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => list,
  }
}
