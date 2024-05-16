import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocations: api.GetLocationsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Location.list()

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => list,
  }
}

export const createLocation: api.CreateLocationOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) =>
  core.withTransaction(async () => {
    const entity = await incomingRequest.entity()

    const result = await core.Location.create({
      name: entity.title,
      handle: entity.handle,
    })

    const resultEntity = {
      id: result.id,
    }

    return {
      status: 201,
      contentType: 'application/json',
      entity: () => resultEntity,
    }
  })
