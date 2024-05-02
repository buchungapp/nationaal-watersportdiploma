import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const apiToken: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (credential) => {
  switch (credential) {
    case 'supersecret':
      return {
        school: '',
      }

    default:
      return
  }
}
