import { ApiKeyAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const apiKey: ApiKeyAuthenticationHandler<
  application.Authentication
> = async (token) => {
  switch (token) {
    case 'supersecret':
      return {
        school: '',
      }

    default:
      return
  }
}
