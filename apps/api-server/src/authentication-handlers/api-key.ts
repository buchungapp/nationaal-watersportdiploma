import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  const apiKeyItem = await core.ApiKey.byToken(token)

  if (apiKeyItem == null) {
    return
  }

  return {
    apiKey: apiKeyItem.id,
    user: apiKeyItem.userId,
    isSuper: false,
  }
}
