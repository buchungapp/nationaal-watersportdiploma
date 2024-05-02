import { listen } from '@nawadi/api'
import * as core from '@nawadi/core'
import { URL } from 'node:url'
import * as application from '../application/index.js'

export interface ServerContext {
  server: application.Server
  baseUrl: URL
}
export async function withTestEnvironment<T>(
  job: (context: ServerContext) => Promise<T>,
): Promise<T> {
  return await core.withSupabaseClient(
    {
      serviceRoleKey: '', // TODO fill in these
      url: '', // TODO fill in
    },
    () =>
      core.withTestTransaction(async () => {
        const server = application.createApplicationServer()
        await using listener = await listen(server, {})

        const { port } = listener
        const baseUrl = new URL(`http://localhost:${port}`)

        const result = await job({ server, baseUrl })
        return result
      }),
  )
}
