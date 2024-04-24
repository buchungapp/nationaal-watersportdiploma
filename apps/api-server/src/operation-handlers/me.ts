import * as api from '@nawadi/api'
import * as application from '../application/index.js'

export const me: api.MeOperationHandler<application.Authentication> = async (
  incomingRequest,
  authentication,
) => {
  return {
    status: 200,
    parameters: {},
    contentType: 'application/json',
    entity: () => ({
      id: '',
      handle: '',
    }),
  }
}
