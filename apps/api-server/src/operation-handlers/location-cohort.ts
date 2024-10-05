import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const getLocationCohorts: api.server.GetLocationCohortsOperationHandler<
  application.Authentication
> = async ({ locationKey }) => {
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
> = async ({ locationKey }, entity) =>
  core.withTransaction(async () => {
    // TODO create cohort

    return [201, { id: '' }]
  })
