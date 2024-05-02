import { OpenIdAuthenticationHandler } from '@nawadi/api'
import * as application from '../application/index.js'

export const openId: OpenIdAuthenticationHandler<
  application.Authentication
> = async (credential) => {
  switch (credential) {
    case 'supersecret':
      return {
        user: '',
        people: [],
      }

    default:
      return
  }
}
