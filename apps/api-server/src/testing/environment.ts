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
      serviceRoleKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', // cspell:disable-line
      url: 'http://localhost:54321',
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
