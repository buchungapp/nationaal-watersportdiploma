import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listDisciplines: api.ListDisciplinesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.Discipline.list()

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => list,
  }
}

export const retrieveDiscipline: api.RetrieveDisciplineOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { disciplineKey } = incomingRequest.parameters

  let disciplineItem: Awaited<ReturnType<typeof core.Program.Discipline.fromId>>

  if (api.validators.isComponentsId(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromId(disciplineKey)
  } else if (api.validators.isComponentsHandle(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromHandle(disciplineKey)
  } else {
    throw 'impossible'
  }

  if (disciplineItem == null) {
    return {
      status: 404,
      contentType: null,
    }
  }

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => disciplineItem,
  }
}
