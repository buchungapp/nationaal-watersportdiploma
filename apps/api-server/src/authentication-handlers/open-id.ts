import { OpenIdAuthenticationHandler } from '@nawadi/api'
import { useSupabaseClient } from '@nawadi/core'
import * as application from '../application/index.js'

export const openId: OpenIdAuthenticationHandler<
  application.Authentication
> = async (token) => {
  switch (token) {
    case 'supersecret':
      return {
        user: '00000000-0000-0000-0000-000000000000',
        people: [],
      }
  }

  const supabase = useSupabaseClient()
  const userResponse = await supabase.auth.getUser(token)

  if (userResponse.error != null) {
    // TODO how do we log? opentelemetry?
    console.error(userResponse.error)
    return
  }

  const { user } = userResponse.data

  // TODO select user id from database
  // and select people from database
  // also come up with a better name for "people"

  return {
    user: user.id,
    people: [],
  }
}
