import * as opentelemetry from '@opentelemetry/api'
import { CoreError } from './error.js'

const commandTracer = opentelemetry.trace.getTracer('command')
const queryTracer = opentelemetry.trace.getTracer('query')

/**
 * Wrap a command to support error handling and telemetry
 *
 * @param task the function that is the command. Ideally this function has a name
 * @returns the result of the command function
 */
export function wrapCommand<R, A extends unknown[]>(
  task: (...args: A) => Promise<R>,
) {
  const result = wrap(commandTracer, task)
  return result
}

/**
 * Wrap a query to support error handling and telemetry
 *
 * @param task the function that is the query. Ideally this function has a name
 * @returns the result of the query function
 */
export function wrapQuery<R, A extends unknown[]>(
  task: (...args: A) => Promise<R>,
) {
  const result = wrap(queryTracer, task)
  return result
}

function wrap<R, A extends unknown[]>(
  tracer: opentelemetry.Tracer,
  task: (...args: A) => Promise<R>,
) {
  return async (...args: A): Promise<R> => {
    const result = await tracer.startActiveSpan(task.name, async (span) => {
      try {
        const result = await task(...args)
        return result
      } catch (error) {
        const coreError = CoreError.fromUnknown(error)
        if (coreError != null) {
          throw coreError
        }
        throw error
      } finally {
        span.end()
      }
    })

    return result
  }
}
