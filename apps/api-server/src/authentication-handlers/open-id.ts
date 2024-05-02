import { OpenIdAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const openId: OpenIdAuthenticationHandler<
  application.Authentication
> = async (token) => {
  const supabase = core.useSupabaseClient()
  const userResponse = await supabase.auth.getUser(token)

  if (userResponse.error != null) {
    core.warn(userResponse.error)
    return
  }

  const { user: authUser } = userResponse.data

  // TODO make this proposal work
  const userItem = await core.User.byOauthId(authUser.id)
  if (userItem == null) {
    // TODO log something?
    core.warn('user not found')
    return
  }

  const personItems = await core.User.Person.byUserId(userItem.id)

  return {
    user: userItem.id,
    persons: personItems.map((item) => item.id),
  }
}
