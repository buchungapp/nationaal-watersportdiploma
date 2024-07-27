import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocations: api.server.GetLocationsOperationHandler<
  application.Authentication
> = async () => {
  const list = await core.Location.list()

  const listEntity = list.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.name,
  }))

  return listEntity
}

export const createLocation: api.server.CreateLocationOperationHandler<
  application.Authentication
> = async (entity) =>
  core.withTransaction(async () => {
    const result = await core.Location.create({
      name: entity.title,
      handle: entity.handle,
      // TODO add website-url
    })

    const resultEntity = {
      id: result.id,
    }

    return [201, resultEntity]
  })
