import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listCountries: api.ListCountriesOperationHandler<
  application.Authentication
> = async (incomingRequest) => {
  const entity = await core.Platform.Country.list()

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => entity,
  }
}
