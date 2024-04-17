import { TokenAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const token: TokenAuthenticationHandler<application.Authentication> = (
  credential,
) => {
  switch (credential) {
    case 'supersecret':
      return {
        userId: 1,
      }

    default:
      // TODO This should return nothing once the generator supports it
      return undefined as any
  }
}
