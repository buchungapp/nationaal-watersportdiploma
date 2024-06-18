import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const findCertificate: api.FindCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { certificateHandle, issuedAt } = incomingRequest.parameters

  if ('apiKey' in authentication) {
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

    const responseEntity: api.types.CertificateModel = {
      id: certificateItem.id,
      handle: certificateItem.handle,
      studentCurriculumId: certificateItem.studentCurriculumId,
      issuedAt: certificateItem.issuedAt ?? undefined,
      visibleFrom: certificateItem.visibleFrom ?? undefined,
      createdAt: certificateItem.createdAt,
      updatedAt: certificateItem.updatedAt,
      deletedAt: certificateItem.deletedAt ?? undefined,
    }

    return {
      status: 200,
      contentType: 'application/json',
      entity: () => responseEntity,
    }
  }

  return {
    status: 403,
    contentType: null,
  }
}

export const getCertificate: api.GetCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { certificateKey } = incomingRequest.parameters

  if ('apiKey' in authentication) {
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
      // TODO create a BLL operation
      throw 'not supported yet'
    } else if (api.validators.isFieldsId(certificateKey)) {
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

    const responseEntity: api.types.CertificateModel = {
      id: certificateItem.id,
      handle: certificateItem.handle,
      studentCurriculumId: certificateItem.studentCurriculumId,
      issuedAt: certificateItem.issuedAt ?? undefined,
      visibleFrom: certificateItem.visibleFrom ?? undefined,
      createdAt: certificateItem.createdAt,
      updatedAt: certificateItem.updatedAt,
      deletedAt: certificateItem.deletedAt ?? undefined,
    }

    return {
      status: 200,
      contentType: 'application/json',
      entity: () => responseEntity,
    }
  }

  return {
    status: 403,
    contentType: null,
  }
}

export const listCertificatesByNumber: api.ListCertificatesByNumberOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { numbers } = incomingRequest.parameters

  if ('apiKey' in authentication) {
    if (!authentication.apiKey.isSuper) {
      return {
        status: 403,
        contentType: null,
      }
    }

    const certificateList = await core.Certificate.list({
      filter: {
        number: numbers,
      },
    })

    const responseEntity: api.types.CertificateModel[] = certificateList.map(
      (certificateItem) => {
        return {
          id: certificateItem.id,
          handle: certificateItem.handle,
          studentCurriculumId: certificateItem.studentCurriculumId,
          issuedAt: certificateItem.issuedAt ?? undefined,
          visibleFrom: certificateItem.visibleFrom ?? undefined,
          createdAt: certificateItem.createdAt,
          updatedAt: certificateItem.updatedAt,
          deletedAt: certificateItem.deletedAt ?? undefined,
        }
      },
    )

    return {
      status: 200,
      contentType: 'application/json',
      entity: () => responseEntity,
    }
  }

  if ('openId' in authentication) {
    const certificateList = await core.Certificate.list({
      filter: {
        number: numbers,
        locationId: authentication.openId.locationIds,
      },
    })

    const responseEntity = certificateList.map((certificateItem) => {
      return {
        id: certificateItem.id,
        handle: certificateItem.handle,
        studentCurriculumId: certificateItem.studentCurriculumId,
        issuedAt: certificateItem.issuedAt ?? undefined,
        visibleFrom: certificateItem.visibleFrom ?? undefined,
        createdAt: certificateItem.createdAt,
        updatedAt: certificateItem.updatedAt,
        deletedAt: certificateItem.deletedAt ?? undefined,
      }
    })

    return {
      status: 200,
      contentType: 'application/json',
      entity: () => responseEntity,
    }
  }

  return {
    status: 403,
    contentType: null,
  }
}
