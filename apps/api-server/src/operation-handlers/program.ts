import * as api from '@nawadi/api'
import { Program, withTransaction } from '@nawadi/core'
import * as application from '../application/index.js'

export const getPrograms: api.GetProgramsOperationHandler<
  application.Authentication
> = (incomingRequest, authentication) =>
  withTransaction(async () => {
    const programsEntity = (await Program.list()).map((item) => ({
      id: item.id,
      handle: item.handle,
      title: item.title,
      degreeId: item.degree.id,
      degreeTitle: item.degree.title,
      disciplineId: item.discipline.id,
      disciplineTitle: item.discipline.title,
    }))

    return {
      status: 200,
      parameters: {},
      contentType: 'application/json',
      entity: () => programsEntity,
    }
  })
