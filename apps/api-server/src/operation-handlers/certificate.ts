import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const findCertificate: api.FindCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest) => {
  const { certificateHandle, issuedAt } = incomingRequest.parameters

  const certificateItem = await core.Certificate.find({
    handle: certificateHandle,
    issuedAt,
  })

  // FIXME according to the types certificateItem is never null
  if (certificateItem == null) {
    return {
      status: 404,
      contentType: null,
    }
  }

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => certificateItem,
  }
}
