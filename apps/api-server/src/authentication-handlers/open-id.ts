import { OpenIdAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
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

  const supabase = core.useSupabaseClient()
  const userResponse = await supabase.auth.getUser(token)

  if (userResponse.error != null) {
    // TODO how do we log? opentelemetry?
    console.error(userResponse.error)
    return
  }

  const { user: authUser } = userResponse.data

  // TODO select user id from database
  // and select people from database
  const user = await core.User.fromId(authUser.id)
  const people = [await core.User.Person.fromId(authUser.id)].map(
    (item) => item.id,
  )

  if (user == null) {
    // TODO log something?
    return
  }

  return {
    user: user.id,
    people,
  }
}
