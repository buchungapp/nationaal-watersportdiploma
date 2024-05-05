import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listDisciplines: api.ListDisciplinesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const disciplineList = await core.Program.Discipline.list()

  const responseEntity = disciplineList.map((item) => ({
    id: item.id,
    handle: item.handle,
  }))

  return {
    parameters: {},
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}

export const retrieveDiscipline: api.RetrieveDisciplineOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { disciplineKey } = incomingRequest.parameters

  // TODO get discipline type from core
  let disciplineItem: Awaited<
    ReturnType<typeof core.Program.Discipline.fromHandle>
  >

  if (api.isComponentsHandle(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromHandle(disciplineKey)
  } else if (api.isComponentsId(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromId(disciplineKey)
  } else {
    throw 'impossible'
  }

  if (disciplineItem == null) {
    return {
      parameters: {},
      status: 404,
      contentType: null,
    }
  }

  const responseEntity = {
    id: disciplineItem.id,
    handle: disciplineItem.handle,
  }

  return {
    parameters: {},
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}
