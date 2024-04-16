import * as db from '@nawadi/db'
import { AsyncLocalStorage } from 'async_hooks'
import postgres from 'postgres'
import { useDatabase, withDatabase } from './database.js'

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

/**
 *
 * Migrates the local supabase database to the latest version and then runs the job
 * with a database context that points to the local supabase database. The job is run
 * in a transaction that is rolled back at the end of the job so that the database
 * is kept clean
 *
 * @param job async test job to run
 * @returns whatever the job returns
 */
export async function withTestTransaction<T>(
  job: () => Promise<T>,
): Promise<T> {
  const pgUri =
    process.env.PGURI ??
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

  {
    // use a single connection pool for the migration
    const pgSql = postgres(pgUri.toString(), {
      max: 1,
    })
    try {
      const database = db.createDatabase(pgSql)
      // migrate (set up) the database
      await db.migrateDatabase(database)
    } finally {
      await pgSql.end()
    }
  }

  const result = await withDatabase({ pgUri }, async () =>
    withTransaction(async () => {
      try {
        const result = await job()
        return result
      } finally {
        const transaction = useTransaction()
        try {
          transaction!.rollback()
        } catch (error) {
          // rollback will throw a Rollback error this is expected behavior and
          // therefore should not throw
        }
      }
    }),
  )

  return result
}
