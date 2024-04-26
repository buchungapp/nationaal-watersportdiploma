import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { AsyncLocalStorage } from 'async_hooks'

/**
 * A context-based storage for SupabaseClient instances.
 */
const storage = new AsyncLocalStorage<SupabaseClient>()

/**
 * A configuration interface for the SupabaseClient.
 */
export interface SupabaseConfiguration {
  /**
   * The URL of the Supabase API.
   */
  url: string
  /**
   * The service role key for authentication.
   */
  serviceRoleKey: string
}

/**
 * A function that runs a job with a provided SupabaseClient instance.
 * @param configuration - The configuration for the SupabaseClient.
 * @param job - The function to be executed with the SupabaseClient.
 * @returns The result of the job function.
 */
export async function withSupabaseClient<T>(
  configuration: SupabaseConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const { url, serviceRoleKey } = configuration
  const client = createClient(url, serviceRoleKey, {
    // customize supabase configuration here
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: 'pkce',
    },
  })
  const result = await storage.run(client, job)
  return result
}

/**
 * A function that retrieves the current SupabaseClient instance from the context.
 * @returns The current SupabaseClient instance.
 * @throws TypeError if no SupabaseClient instance is found in the context.
 */
export function useSupabaseClient(): SupabaseClient {
  const client = storage.getStore()
  if (client == null) {
    throw new TypeError('Supabase client not in context')
  }
  return client
}
