import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listPrograms: api.ListProgramsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.list()

  const listEntity = list.map((item) => ({
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
    contentType: 'application/json',
    entity: () => listEntity,
  }
}
