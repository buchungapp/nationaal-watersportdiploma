import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listPrograms: api.ListProgramsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.list()

  const responseEntity: api.types.ProgramModel[] = list.map((item) => {
    return {
      discipline: {
        deletedAt: item.discipline.deletedAt ?? undefined,
        createdAt: item.discipline.createdAt,
        updatedAt: item.discipline.updatedAt,
        handle: item.discipline.handle,
        id: item.discipline.id,
        title: item.discipline.title ?? undefined,
        weight: item.discipline.weight,
      },
      degree: {
        deletedAt: item.degree.deletedAt ?? undefined,
        createdAt: item.degree.createdAt,
        rang: item.degree.rang,
        updatedAt: item.degree.updatedAt,
        handle: item.degree.handle,
        id: item.degree.id,
        title: item.degree.title ?? undefined,
      },
      id: item.id,
      deletedAt: item.deletedAt ?? undefined,
      handle: item.handle,
      title: item.title ?? undefined,
      categories: item.categories.map((item) => {
        return {
          handle: item.handle,
          title: item.title ?? undefined,
          id: item.id,
          updatedAt: item.updatedAt,
          weight: item.weight,
          deletedAt: item.deletedAt ?? undefined,
          description: item.description ?? undefined,
          createdAt: item.createdAt,
          parent:
            item.parent == null
              ? undefined
              : {
                  updatedAt: item.parent.updatedAt,
                  description: item.parent.description ?? undefined,
                  deletedAt: item.parent.deletedAt ?? undefined,
                  id: item.parent.id,
                  createdAt: item.parent.createdAt,
                  weight: item.parent.weight,
                  title: item.parent.title ?? undefined,
                  handle: item.parent.handle,
                },
        }
      }),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  })

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}
