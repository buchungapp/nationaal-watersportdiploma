import * as db from '@nawadi/db'
import { AsyncLocalStorage } from 'async_hooks'
import { useDatabase } from './database.js'

// Initializes an instance of AsyncLocalStorage to store database transaction contexts.
const storage = new AsyncLocalStorage<db.Transaction>()

/**
 * Executes a given job within a database transaction.
 *
 * This function automatically manages the lifecycle of a database transaction. It starts a new
 * transaction, executes the provided job within this transaction, and then commits the transaction
 * if the job completes successfully, or rolls it back if an error occurs.
 *
 * @param job A function that performs operations within a transaction and returns a promise.
 * @returns Returns a promise that resolves with the result of the job function if the transaction
 *          is successfully committed, or rejects with an error if the transaction fails or the job
 *          throws an error.
 */
export async function withTransaction<T>(job: () => Promise<T>): Promise<T> {
  const database = useDatabase()
  const result = await database.transaction(async (transaction) => {
    const result = await storage.run(transaction, job)
    return result
  })
  return result
}

/**
 * Retrieves the current database transaction from the AsyncLocalStorage.
 *
 * This function can be used within a job running in `withTransaction` to access the current
 * database transaction context. It allows operations within the job to participate in the
 * transaction initiated by `withTransaction`.
 *
 * @returns The current database transaction if one is active in the AsyncLocalStorage context,
 *          otherwise undefined.
 */
export function useTransaction(): db.Transaction | undefined {
  const context = storage.getStore()
  return context
}
