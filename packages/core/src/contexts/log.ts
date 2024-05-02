import { AsyncLocalStorage } from 'async_hooks'

export interface LogConfiguration {
  error: (message: string | Error) => void
  warn: (message: string | Error) => void
  info: (message: string | Error) => void
}

export function consoleLogConfiguration(): LogConfiguration {
  return {
    error(message) {
      console.error(message)
    },
    warn(message) {
      console.warn(message)
    },
    info(message) {
      console.info(message)
    },
  }
}

const storage = new AsyncLocalStorage<LogConfiguration>()

export async function withLog<T>(
  configuration: LogConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const result = await storage.run(configuration, job)
  return result
}

export function error(message: string | Error) {
  const configuration = storage.getStore()
  configuration?.error(message)
}

export function warn(message: string | Error) {
  const configuration = storage.getStore()
  configuration?.warn(message)
}

export function info(message: string | Error) {
  const configuration = storage.getStore()
  configuration?.info(message)
}
