import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  // TODO make this work
  const tokenItem = await core.Token.byToken(token)

  if (tokenItem == null) {
    return
  }

  return {
    apiKey: tokenItem.id,
    school: tokenItem.schoolId,
  }
}
