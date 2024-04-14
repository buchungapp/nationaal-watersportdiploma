import * as db from '@nawadi/db'
import { AsyncLocalStorage } from 'async_hooks'
import postgres from 'postgres'

export interface DatabaseConfiguration {
  pgUri: string
}

const storage = new AsyncLocalStorage<db.Database>()

export async function withDatabase<T>(
  configuration: DatabaseConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const { pgUri } = configuration

  const sql = postgres(pgUri)
  try {
    const database = db.createDatabase(sql)
    const result = await storage.run(database, job)
    return result
  } finally {
    await sql.end()
  }
}

export function useDatabase(): db.Database {
  const database = storage.getStore()
  if (database == null) {
    throw new TypeError('Database not in context')
  }
  return database
}
