import { CoreError } from './error.js'

export function wrapCommand<R, A extends unknown[]>(
  task: (...args: A) => Promise<R>,
) {
  const result = wrap(task)
  return result
}

export function wrapQuery<R, A extends unknown[]>(
  task: (...args: A) => Promise<R>,
) {
  const result = wrap(task)
  return result
}

function wrap<R, A extends unknown[]>(task: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R> => {
    try {
      const result = await task(...args)
      return result
    } catch (error) {
      const coreError = CoreError.fromUnknown(error)
      if (coreError != null) {
        throw coreError
      }
      throw error
    }
  }
}
