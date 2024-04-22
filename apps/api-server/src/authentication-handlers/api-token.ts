import { ApiTokenAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const apiToken: ApiTokenAuthenticationHandler<
  application.Authentication
> = async (credential) => {
  switch (credential) {
    case 'supersecret':
      return {
        userId: 1,
        super: true,
      }

    default:
      return
  }
}
