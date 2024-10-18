import * as opentelemetry from '@opentelemetry/api'
import { CoreError } from './error.js'

import Appsignal from '@appsignal/nodejs'
import { useLogger } from './log.js'

const commandTracer = opentelemetry.trace.getTracer('command')
const queryTracer = opentelemetry.trace.getTracer('query')

type TracerFunction = <R, A extends unknown[]>(
  name: string,
  task: (...args: A) => Promise<R>,
) => (...args: A) => Promise<R>

const createWrapper = (tracer: opentelemetry.Tracer): TracerFunction => {
  return (name, task) => {
    return async (...args) => {
      return tracer.startActiveSpan(name, async (span) => {
        Appsignal.setRootName(name)

        try {
          //   span.setAttribute("args", JSON.stringify(args));
          const result = await task(...args)
          //   span.setAttribute("result", JSON.stringify(result));
          return result
        } catch (error) {
          const coreError = CoreError.fromUnknown(error)
          span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR })
          useLogger().error({ error: coreError }, `Error in ${name}`)
          Appsignal.setError(coreError, span)
          throw coreError
        } finally {
          span.end()
        }
      })
    }
  }
}

export const wrapCommand: TracerFunction = createWrapper(commandTracer)
export const wrapQuery: TracerFunction = createWrapper(queryTracer)
