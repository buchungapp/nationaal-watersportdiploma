import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocationCertificates: api.GetLocationCertificatesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey } = incomingRequest.parameters

  // TODO list certificates

  return {
    status: 200,
    parameters: {},
    contentType: 'application/json',
    entity: () => [
      {
        id: '',
        handle: '',
        title: '',
      },
      {
        id: '',
        handle: '',
        title: '',
      },
    ],
  }
}

export const createLocationCertificate: api.CreateLocationCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) =>
  core.withTransaction(async () => {
    const { locationKey } = incomingRequest.parameters
    const entity = await incomingRequest.entity()

    // TODO create certificate

    return {
      status: 201,
      parameters: {},
      contentType: 'application/json',
      entity: () => ({
        id: '',
      }),
    }
  })
