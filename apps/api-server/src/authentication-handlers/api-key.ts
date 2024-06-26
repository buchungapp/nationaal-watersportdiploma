import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  if (token === '00000000-0000-0000-0000-000000000000') {
    return {
      apiKey: '00000000-0000-0000-0000-000000000000',
      user: '00000000-0000-0000-0000-000000000000',
      isSuper: true,
    }
  }

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
