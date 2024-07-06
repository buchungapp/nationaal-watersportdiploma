import { useSupabaseClient } from '../../contexts/index.js'

export const getUserIdByJwt = async (jwt: string) => {
  const supabase = useSupabaseClient()

  const { data, error } = await supabase.auth.getUser(jwt)

  if (error) {
    throw new Error(error.message)
  }

  return data.user.id
}

export const createAuthUser = async ({ email }: { email: string }) => {
  const supabase = useSupabaseClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (error) {
    throw error
  }

  return data.user.id
}
