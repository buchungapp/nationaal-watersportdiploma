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
  const userItem = await core.User.fromId(authUser.id)
  if (userItem == null) {
    core.warn('user not found')
    return
  }

  const personItems = await core.User.Person.list({
    filters: { userId: userItem.id },
  })

  return {
    user: userItem.id,
    persons: personItems.map((item) => item.id),
  }
}
