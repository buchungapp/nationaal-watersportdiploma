import { AsyncLocalStorage } from 'node:async_hooks'
import { pino, type LoggerOptions } from 'pino'

type Logger = pino.Logger

interface LoggerContext {
  requestId?: string
  logger: Logger
}

const asyncLocalStorage = new AsyncLocalStorage<LoggerContext>()

interface CreateLoggerOptions extends LoggerOptions {
  requestId?: string
}

export const pinoPrettyConfiguration: LoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{requestId} - {msg}',
    },
  },
  level: 'debug',
}

function createLogger(options: CreateLoggerOptions = {}): Logger {
  const { requestId, ...loggerOptions } = options
  return pino({ ...loggerOptions, base: { requestId } })
}

export function useLogger(): Logger {
  const context = asyncLocalStorage.getStore()
  if (!context) {
    throw new Error(
      'Logger context not found. Make sure to wrap your code with withLogger()',
    )
  }
  return context.logger
}

interface withLoggerOptions extends CreateLoggerOptions {
  requestId?: string
}

export function withLogger<T>(options: withLoggerOptions, fn: () => T): T {
  const existingContext = asyncLocalStorage.getStore()
  let logger: Logger

  if (existingContext) {
    // If there's an existing context, create a child logger
    const childOptions = {
      ...options,
      requestId: options.requestId,
    }
    logger = existingContext.logger.child(childOptions)
  } else {
    // If no existing context, create a new logger
    logger = createLogger(options)
  }

  return asyncLocalStorage.run(
    { requestId: logger.bindings().requestId, logger },
    fn,
  )
}
