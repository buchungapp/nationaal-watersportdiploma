import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<your_supabase_url>',
  '<your_supabase_key>',
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-NWD-Version': package,
      },
    },
  },
)
