import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const findCertificate: api.FindCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { certificateHandle, issuedAt } = incomingRequest.parameters

  if (!authentication.apiKey.isSuper) {
    return {
      status: 403,
      contentType: null,
    }
  }

  const certificateItem = await core.Certificate.find({
    handle: certificateHandle,
    issuedAt,
  })

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

export const getCertificate: api.GetCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { certificateKey } = incomingRequest.parameters

  if (!authentication.apiKey.isSuper) {
    return {
      status: 403,
      contentType: null,
    }
  }

  let certificateItem:
    | Awaited<ReturnType<typeof core.Certificate.byId>>
    | undefined
  if (api.validators.isCertificateHandle(certificateKey)) {
    throw 'not supported yet'
  } else if (api.validators.isComponentsId(certificateKey)) {
    certificateItem = await core.Certificate.byId(certificateKey)
  } else {
    throw 'impossible'
  }

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
