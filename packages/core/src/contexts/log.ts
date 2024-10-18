import { AsyncLocalStorage } from 'node:async_hooks'
import { pino, type LoggerOptions } from 'pino'
import pretty from 'pino-pretty'

type Logger = pino.Logger

interface LoggerContext {
  requestId?: string
  logger: Logger
}

const asyncLocalStorage = new AsyncLocalStorage<LoggerContext>()

interface CreateLoggerOptions extends LoggerOptions {
  requestId?: string
}

const prettyOptions = {
  colorize: true,
  levelFirst: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
  messageFormat: '{requestId} - {msg}',
}

export const pinoPrettyConfiguration: LoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: prettyOptions,
  },
  level: 'debug',
}

export const prettyStream = pretty(prettyOptions)

function createLogger(
  options: CreateLoggerOptions = {},
  stream?: pino.DestinationStream,
): Logger {
  const { requestId, ...loggerOptions } = options
  return pino({ ...loggerOptions, base: { requestId } }, stream)
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

export function withLogger<T>(
  fn: () => T,
  ...pinoArgs: Parameters<typeof createLogger>
): T {
  const existingContext = asyncLocalStorage.getStore()
  let logger: Logger

  const options = pinoArgs[0]!

  if (existingContext) {
    // If there's an existing context, create a child logger
    const childOptions = {
      ...options,
      requestId: options.requestId,
    }
    logger = existingContext.logger.child(childOptions)
  } else {
    // If no existing context, create a new logger
    logger = createLogger(...pinoArgs)
  }

  return asyncLocalStorage.run(
    { requestId: logger.bindings().requestId, logger },
    fn,
  )
}
