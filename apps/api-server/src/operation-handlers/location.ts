import * as api from '@nawadi/api'
import { Location } from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocations: api.GetLocationsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await Location.list()

  const listEntity = list.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.name,
  }))

  return {
    status: 200,
    parameters: {},
    contentType: 'application/json',
    entity: () => listEntity,
  }
}

export const createLocation: api.CreateLocationOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const entity = await incomingRequest.entity()

  const result = await Location.create({
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
}
