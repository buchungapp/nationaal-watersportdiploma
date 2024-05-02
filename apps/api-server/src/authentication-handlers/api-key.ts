import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
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
