import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const validatedEnv = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
  })
  .parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

export const supabase = createClient(
  validatedEnv.SUPABASE_URL,
  validatedEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: 'pkce',
    },
  },
)
