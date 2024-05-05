import * as api from '@nawadi/api'
import assert from 'assert'
import * as application from '../application/index.js'

export const me: api.MeOperationHandler<application.Authentication> = async (
  incomingRequest,
  authentication,
) => {
  let id: string | undefined
  // TODO make this more ergonomic
  if ('apiKey' in authentication && authentication.apiKey != null) {
    id = authentication.apiKey.user
  }

  // TODO make this more ergonomic
  if ('openId' in authentication && authentication.openId != null) {
    id = authentication.openId.user
  }

  assert(id != null)

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => ({
      id,
      handle: '',
    }),
  }
}
