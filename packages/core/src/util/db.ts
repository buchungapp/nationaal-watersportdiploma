import { createDatabase, type Database } from '@nawadi/db'
import postgres from 'postgres'

// Create new database as a singleton
function getDatabaseInstance(): Database {
  if (process.env.PGURI == null) {
    throw new Error('PGURI is not set')
  }

  const pgUri = new URL(process.env.PGURI)
  const pgPool = postgres(pgUri.toString())

  return createDatabase(pgPool) as Database
}

let dbInstance: Database | null = null

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = getDatabaseInstance()
  }
  return dbInstance
}
