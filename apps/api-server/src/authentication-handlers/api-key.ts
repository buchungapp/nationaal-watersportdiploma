import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  // TODO make this work
  const apiKey = await core.ApiKey.byToken(token)

  switch (token) {
    case 'supersecret':
      return {
        apiKey: apiKey.id,
        user: apiKey.userId,
      }

    default:
      return
  }
}
