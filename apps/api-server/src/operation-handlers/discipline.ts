import * as api from '@nawadi/api'
import * as application from '../application/index.js'

export const listDisciplines: api.server.ListDisciplinesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  // const disciplineList = await core.Program.Discipline.list()

  // const responseEntity = disciplineList.map((item) => ({
  //   id: item.id,
  //   handle: item.handle,
  // }))

  return {
    parameters: {},
    status: 200,
    contentType: 'application/json',
    entity: async () => [],
  }
}

export const retrieveDiscipline: api.server.RetrieveDisciplineOperationHandler<
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

  // const responseEntity = {
  //   id: disciplineItem.id,
  //   handle: disciplineItem.handle,
  // }

  // return {
  //   parameters: {},
  //   status: 200,
  //   contentType: 'application/json',
  //   entity: () => responseEntity,
  // }

  return {
    parameters: {},
    status: 404,
    contentType: null,
  }
}
