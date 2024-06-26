import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocations: api.GetLocationsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Location.list()

  const entityResponse: api.types.LocationModel[] = list.map((item) => {
    return {
      shortDescription: item.shortDescription ?? undefined,
      websiteUrl: item.websiteUrl ?? undefined,
      id: item.id,
      deletedAt: item.deletedAt ?? undefined,
      name: item.name ?? undefined,
      handle: item.handle,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      logo:
        item.logo == null
          ? undefined
          : {
              mimeType: item.logo.mimeType ?? undefined,
              size: item.logo.size,
              alt: item.logo.alt ?? undefined,
              width: item.logo.width ?? undefined,
              height: item.logo.height ?? undefined,
              url: item.logo.url,
              createdAt: item.logo.createdAt,
              transformUrl: item.logo.transformUrl,
              name: item.logo.name,
              type: item.logo.type,
              updatedAt: item.logo.updatedAt,
              id: item.logo.id,
            },
      logoSquare:
        item.logoSquare == null
          ? undefined
          : {
              mimeType: item.logoSquare.mimeType ?? undefined,
              size: item.logoSquare.size,
              alt: item.logoSquare.alt ?? undefined,
              width: item.logoSquare.width ?? undefined,
              height: item.logoSquare.height ?? undefined,
              url: item.logoSquare.url,
              createdAt: item.logoSquare.createdAt,
              transformUrl: item.logoSquare.transformUrl,
              name: item.logoSquare.name,
              type: item.logoSquare.type,
              updatedAt: item.logoSquare.updatedAt,
              id: item.logoSquare.id,
            },
      logoCertificate:
        item.logoCertificate == null
          ? undefined
          : {
              mimeType: item.logoCertificate.mimeType ?? undefined,
              size: item.logoCertificate.size,
              alt: item.logoCertificate.alt ?? undefined,
              width: item.logoCertificate.width ?? undefined,
              height: item.logoCertificate.height ?? undefined,
              url: item.logoCertificate.url,
              createdAt: item.logoCertificate.createdAt,
              transformUrl: item.logoCertificate.transformUrl,
              name: item.logoCertificate.name,
              type: item.logoCertificate.type,
              updatedAt: item.logoCertificate.updatedAt,
              id: item.logoCertificate.id,
            },
    }
  })

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => entityResponse,
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
