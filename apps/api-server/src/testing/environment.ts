import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import { URL } from 'node:url'
import * as application from '../application/index.js'

export interface TestEnvironmentConfiguration {
  isolation: 'supabase' | 'transaction'
}
export interface TestEnvironmentContext {
  server: application.Server
  baseUrl: URL
}
export async function withTestEnvironment<T>(
  configuration: TestEnvironmentConfiguration,
  job: (context: TestEnvironmentContext) => Promise<T>,
): Promise<T> {
  let lastError
  const logConfiguration: core.LogConfiguration = {
    error: (error) => {
      lastError = error
    },
  }

  const jobWrapper = async () => {
    const server = application.createApplicationServer()
    await using listener = await api.lib.listen(server, {})

    const { port } = listener
    const baseUrl = new URL(`http://localhost:${port}`)

    api.facade.defaultClientConfiguration.baseUrl = baseUrl

    const result = await job({ server, baseUrl })
    return result
  }

  let transactionWrapper: () => Promise<T>
  switch (configuration.isolation) {
    case 'supabase':
      transactionWrapper = async () => await core.withTestDatabase(jobWrapper)
      break

    case 'transaction':
      transactionWrapper = async () =>
        await core.withTestTransaction(jobWrapper)
      break

    default:
      throw 'impossible'
  }

  const supabaseWrapper = async () =>
    await core.withSupabaseClient(
      {
        serviceRoleKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', // cspell:disable-line
        url: 'http://localhost:54321',
      },
      transactionWrapper,
    )

  const logWrapper = async () =>
    await core.withLog(logConfiguration, supabaseWrapper)

  try {
    const result = await logWrapper()
    return result
  } finally {
  }
}
