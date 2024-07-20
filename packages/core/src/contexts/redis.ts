import { AsyncLocalStorage } from 'async_hooks'
import { Redis } from 'ioredis'

/**
 * A context-based storage for RedisInstance instances.
 */
const storage = new AsyncLocalStorage<Redis>()

/**
 * A configuration interface for the RedisInstance.
 */
export interface RedisConfiguration {
  /**
   * The URL of the Redis instance.
   */
  url: string
}

/**
 * A function that runs a job with a provided Redis instance.
 * @param configuration - The configuration for the RedisInstance.
 * @param job - The function to be executed with the RedisInstance.
 * @returns The result of the job function.
 */
export async function withRedisClient<T>(
  configuration: RedisConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const { url } = configuration
  const client = new Redis(url)

  const result = await storage.run(client, job)
  return result
}

/**
 * A function that retrieves the current RedisInstance instance from the context.
 * @returns The current RedisInstance instance.
 * @throws TypeError if no RedisInstance instance is found in the context.
 */
export function useRedisClient(): Redis {
  const client = storage.getStore()
  if (client == null) {
    throw new TypeError('RedisInstance not in context')
  }
  return client
}
