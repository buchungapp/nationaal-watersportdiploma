import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listCurriculaByDiscipline: api.ListCurriculaByDisciplineOperationHandler<
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

  const curriculumList = await core.Curriculum.list({
    filter: { onlyCurrentActive: true, disciplineId: disciplineItem.id },
  })

  const responseEntity: api.types.CurriculumModel[] = curriculumList.map(
    (curriculumItem) => {
      return {
        updatedAt: curriculumItem.updatedAt,
        modules: curriculumItem.modules.map((moduleItem) => {
          return {
            id: moduleItem.id,
            competencies: moduleItem.competencies.map((competencyItem) => {
              return {
                weight: competencyItem.weight,
                type: competencyItem.type ?? undefined,
                handle: competencyItem.handle,
                isRequired: competencyItem.isRequired,
                requirement: competencyItem.requirement ?? undefined,
                id: competencyItem.id,
                title: competencyItem.title ?? undefined,
                updatedAt: competencyItem.updatedAt,
                deletedAt: competencyItem.deletedAt ?? undefined,
                createdAt: competencyItem.createdAt,
              }
            }),
            handle: moduleItem.handle,
            deletedAt: moduleItem.deletedAt ?? undefined,
            updatedAt: moduleItem.updatedAt,
            isRequired: moduleItem.isRequired,
            weight: moduleItem.weight,
            type: moduleItem.type ?? undefined,
            createdAt: moduleItem.createdAt,
            title: moduleItem.title ?? undefined,
          }
        }),
        id: curriculumItem.id,
        programId: curriculumItem.programId,
        createdAt: curriculumItem.createdAt,
        startedAt: curriculumItem.startedAt ?? undefined,
        deletedAt: curriculumItem.deletedAt ?? undefined,
        revision: curriculumItem.revision,
      }
    },
  )

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}
