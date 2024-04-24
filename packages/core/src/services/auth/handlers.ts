import { supabase } from './supabase.js'

export const getUserIdByJwt = async (jwt: string) => {
  const { data, error } = await supabase.auth.getUser(jwt)

  if (error) {
    throw new Error(error.message)
  }

  return data.user.id
}

export const createAuthUser = async ({ email }: { email: string }) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.user.id
}
