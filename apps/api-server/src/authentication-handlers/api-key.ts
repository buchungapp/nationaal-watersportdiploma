import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  // TODO make this work
  const tokenItem = await core.ApiKey.byToken(token)

  if (tokenItem == null) {
    return
  }

  return {
    apiKey: tokenItem.id,
    location: '00000000-0000-0000-0000-000000000000',
  }
}
