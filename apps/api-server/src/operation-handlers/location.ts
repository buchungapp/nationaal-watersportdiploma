import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocations: api.server.GetLocationsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Location.list()

  const listEntity = list.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.name,
  }))

  // TODO this could be easier
  return {
    status: 200,
    parameters: {},
    contentType: 'application/json',
    entity: () => listEntity,
  }
}

export const createLocation: api.server.CreateLocationOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) =>
  core.withTransaction(async () => {
    const entity = await incomingRequest.entity()

    const result = await core.Location.create({
      name: entity.title,
      handle: entity.handle,
      // TODO add website-url
    })

    const resultEntity = {
      id: result.id,
    }

    return {
      status: 201,
      parameters: {},
      contentType: 'application/json',
      entity: () => resultEntity,
    }
  })
