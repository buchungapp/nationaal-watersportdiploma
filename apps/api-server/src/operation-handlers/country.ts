import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listCountries: api.ListCountriesOperationHandler<
  application.Authentication
> = async (incomingRequest) => {
  const list = await core.Platform.Country.list()

  const responseEntity = list.map((item) => ({
    code: item.code,
    name: item.name,
  }))

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}
