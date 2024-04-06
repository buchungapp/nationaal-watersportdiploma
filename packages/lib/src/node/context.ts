import { AsyncLocalStorage } from 'async_hooks'

export class ContextNotFoundError extends Error {
  constructor(public name: string) {
    super(
      `${name} context was not provided. It is possible you have multiple versions installed.`,
    )
  }
}

export type Context<T> = ReturnType<typeof create<T>>

let idSeq = 0
export function create<T>(name: string) {
  const storage = new AsyncLocalStorage<{
    value: T
    version: string
  }>()

  return {
    name,
    with<R>(value: T, cb: () => R) {
      const version = (++idSeq).toString()
      return storage.run({ value, version }, cb)
    },
    use() {
      const context = storage.getStore()
      if (context === undefined) {
        throw new ContextNotFoundError(name)
      }
      return context.value
    },
  }
}

export const Context = {
  create,
}
