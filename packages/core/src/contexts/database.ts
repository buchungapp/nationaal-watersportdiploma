import * as db from '@nawadi/db'
import { AsyncLocalStorage } from 'async_hooks'
import postgres from 'postgres'

/**
 * Interface representing the configuration required for setting up the database connection.
 * @property {string} pgUri - The PostgreSQL connection URI.
 */
export interface DatabaseConfiguration {
  pgUri: string
}

// Instance of AsyncLocalStorage to maintain database connections scoped to specific async operations.
const storage = new AsyncLocalStorage<db.Database>()

/**
 * Executes a given job with a database connection.
 * This function initializes a database connection using the provided configuration,
 * runs the provided job within the context of that database connection, and then
 * closes the connection.
 *
 * @template T The type of the result returned by the job function.
 * @param {DatabaseConfiguration} configuration - The database configuration.
 * @param {() => Promise<T>} job - A function representing the job to be executed with the database connection.
 * @returns {Promise<T>} A promise that resolves with the result of the job function.
 */
export async function withDatabase<T>(
  configuration: DatabaseConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const { pgUri } = configuration

  const pgSql = postgres(pgUri)
  try {
    const database = db.createDatabase(pgSql)
    const result = await storage.run(database, job)
    return result
  } finally {
    await pgSql.end()
  }
}

/**
 * Retrieves the current database connection from the AsyncLocalStorage.
 * This function must be called within the context of a function wrapped by `withDatabase`,
 * otherwise, it throws an error indicating that the database is not in context.
 *
 * @returns {db.Database} The current database connection.
 * @throws {TypeError} If called outside of a `withDatabase` context.
 */
export function useDatabase(): db.Database {
  const database = storage.getStore()
  if (database == null) {
    throw new TypeError('Database not in context')
  }
  return database
}

export async function withTestDatabase<T>(job: () => Promise<T>): Promise<T> {
  // a (semi) random database name
  const databaseName = `db_${new Date().valueOf()}`

  const pgUriSuper = new URL(
    process.env.PGURI ??
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  )
  const pgUri = new URL(databaseName, pgUriSuper)

  // create a pool that will be used to create and destroy a database
  const pgSqlSuper = postgres(pgUriSuper.toString())

  try {
    // create a temporary database that we only use for testing
    await pgSqlSuper.unsafe(`CREATE DATABASE ${databaseName}`)
    try {
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
      {
        // use a normal pool for the queries
        const pgSql = postgres(pgUri.toString())
        try {
          const database = db.createDatabase(pgSql)
          const result = await storage.run(database, job)
          return result
        } finally {
          await pgSql.end()
        }
      }
    } finally {
      // finally drop the test-database
      await pgSqlSuper.unsafe(`DROP DATABASE ${databaseName}`)
    }
  } finally {
    // finally end the super pool
    await pgSqlSuper.end()
  }
}
