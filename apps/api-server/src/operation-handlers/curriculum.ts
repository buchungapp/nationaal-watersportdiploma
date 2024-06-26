import * as api from '@nawadi/api'
import * as application from '../application/index.js'

export const retrieveCurriculaByDiscipline: api.server.RetrieveCurriculaByDisciplineOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  // const { disciplineKey } = incomingRequest.parameters

  // // TODO get discipline type from core
  // let disciplineItem: Awaited<
  //   ReturnType<typeof core.Program.Discipline.fromHandle>
  // >

  // if (api.validators.isHandle(disciplineKey)) {
  //   disciplineItem = await core.Program.Discipline.fromHandle(disciplineKey)
  // } else if (api.validators.isId(disciplineKey)) {
  //   disciplineItem = await core.Program.Discipline.fromId(disciplineKey)
  // } else {
  //   throw 'impossible'
  // }

  // if (disciplineItem == null) {
  //   return {
  //     parameters: {},
  //     status: 404,
  //     contentType: null,
  //   }
  // }

  // const curriculumList = await core.Curriculum.list({
  //   filter: { onlyCurrentActive: true, disciplineId: disciplineItem.id },
  // })

  // const responseEntity = curriculumList.map((item) => ({
  //   id: item.id,
  // }))

  return {
    parameters: {},
    status: 200,
    contentType: 'application/json',
    entity: () => [],
  }
}
