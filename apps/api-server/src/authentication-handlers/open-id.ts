import { OpenIdAuthenticationHandler } from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const openId: OpenIdAuthenticationHandler<
  application.Authentication
> = async (token) => {
  try {
    const supabase = core.useSupabaseClient()
    const userResponse = await supabase.auth.getUser(token)

    if (userResponse.error != null) {
      core.warn(userResponse.error)
      return
    }

    const { user: authUser } = userResponse.data

    const personItems = await core.User.Person.list({
      filters: { userId: authUser.id },
    })

    return {
      user: authUser.id,
      persons: personItems.map((item) => item.id),
    }
  } catch (error) {
    core.error(error)
  }
}
