export async function throttlePromises<T>(
  funcs: (() => Promise<T>)[],
  maxConcurrent: number,
): Promise<T[]> {
  let index = 0
  const results: T[] = []
  const executing: Promise<void>[] = []

  const executeNext = (): Promise<void> => {
    if (index >= funcs.length) return Promise.resolve()
    const i = index++
    const promise = funcs[i]!()
      .then((result) => {
        results[i] = result
      })
      .finally(() => {
        const execIndex = executing.indexOf(promise)
        if (execIndex > -1) {
          executing.splice(execIndex, 1)
        }
      })

    executing.push(promise)
    const nextPromise = promise.then(() => {
      if (executing.length < maxConcurrent) {
        return executeNext()
      }
    })

    return nextPromise
  }

  for (let i = 0; i < maxConcurrent && i < funcs.length; i++) {
    executeNext()
  }

  return Promise.all(executing).then(() => results)
}
