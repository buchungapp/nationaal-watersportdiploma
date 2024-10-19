import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocationCertificates: api.server.GetLocationCertificatesOperationHandler<
  application.Authentication
> = async ({ locationKey }) => {
  // TODO get type from core
  let locationItem: Awaited<ReturnType<typeof core.Location.fromHandle>>

  if (api.validators.isHandle(locationKey)) {
    locationItem = await core.Location.fromHandle(locationKey)
  } else if (api.validators.isId(locationKey)) {
    locationItem = await core.Location.fromId(locationKey)
  } else {
    throw 'impossible'
  }

  if (locationItem == null) {
    return [404, undefined]
  }

  // TODO actually list certificates
  const certificateList: any[] = await (core.Certificate as any).byLocation(
    locationItem.id,
  )

  const responseEntity = certificateList.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.title,
  }))

  return [200, responseEntity]
}

export const createLocationCertificate: api.server.CreateLocationCertificateOperationHandler<
  application.Authentication
> = async ({ locationKey }, requestEntity) =>
  core.withTransaction(async () => {
    // TODO get type from core
    let locationItem: Awaited<ReturnType<typeof core.Location.fromHandle>>

    if (api.validators.isHandle(locationKey)) {
      locationItem = await core.Location.fromHandle(locationKey)
    } else if (api.validators.isId(locationKey)) {
      locationItem = await core.Location.fromId(locationKey)
    } else {
      throw 'impossible'
    }

    if (locationItem == null) {
      return [404, undefined]
    }

    // TODO actually create a certificate
    const certificateItem: any = (core.Certificate as any).create({
      locationId: locationItem.id,
      handle: requestEntity.handle,
      title: requestEntity.title,
    })

    const responseItem = {
      id: certificateItem.id,
    }

    return [201, responseItem]
  })
