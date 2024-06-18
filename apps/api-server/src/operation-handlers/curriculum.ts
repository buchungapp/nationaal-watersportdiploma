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

  const curriculumList = await core.Curriculum.list({
    filter: { onlyCurrentActive: true, disciplineId: disciplineItem.id },
  })

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => curriculumList,
  }
}
