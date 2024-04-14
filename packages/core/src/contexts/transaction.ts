import * as db from '@nawadi/db'
import { AsyncLocalStorage } from 'async_hooks'
import { useDatabase } from './database.js'

const storage = new AsyncLocalStorage<db.Transaction>()

export async function withTransaction<T>(job: () => Promise<T>): Promise<T> {
  const database = useDatabase()
  const result = await database.transaction(async (transaction) => {
    const result = await storage.run(transaction, job)
    return result
  })
  return result
}

export function useTransaction(): db.Transaction | undefined {
  const storage = new AsyncLocalStorage<db.Transaction>()
  const context = storage.getStore()
  return context
}
