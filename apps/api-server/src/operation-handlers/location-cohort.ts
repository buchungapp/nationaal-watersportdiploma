import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocationCohorts: api.server.GetLocationCohortsOperationHandler<
  application.Authentication
> = async (parameters) => {
  const { locationKey } = parameters

  // TODO list cohorts

  return [
    200,
    [
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
  ]
}

export const createLocationCohort: api.server.CreateLocationCohortOperationHandler<
  application.Authentication
> = async (parameters, entity) =>
  core.withTransaction(async () => {
    const { locationKey } = parameters

    // TODO create cohort

    return [201, { id: '' }]
  })
