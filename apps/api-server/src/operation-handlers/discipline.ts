import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listDisciplines: api.ListDisciplinesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.Discipline.list()

  const responseEntity: api.types.DisciplineModel[] = list.map((item) => {
    return {
      deletedAt: item.deletedAt ?? undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      handle: item.handle,
      id: item.id,
      title: item.title ?? undefined,
      weight: item.weight,
    }
  })

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}

export const retrieveDiscipline: api.RetrieveDisciplineOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { disciplineKey } = incomingRequest.parameters

  let disciplineItem: Awaited<ReturnType<typeof core.Program.Discipline.fromId>>

  if (api.validators.isFieldsId(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromId(disciplineKey)
  } else if (api.validators.isFieldsHandle(disciplineKey)) {
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

  const responseEntity: api.types.DisciplineModel = {
    deletedAt: disciplineItem.deletedAt ?? undefined,
    createdAt: disciplineItem.createdAt,
    updatedAt: disciplineItem.updatedAt,
    handle: disciplineItem.handle,
    id: disciplineItem.id,
    title: disciplineItem.title ?? undefined,
    weight: disciplineItem.weight,
  }

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}
