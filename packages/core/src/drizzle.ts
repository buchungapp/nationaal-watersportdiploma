import { createDatabase, type Database } from '@nawadi/db'
import postgres from 'postgres'

if (process.env.PGURI == null) {
  throw new Error('PGURI is not set')
}

const pgUri = new URL(process.env.PGURI)
const pgPool = postgres(pgUri.toString())

export const db = createDatabase(pgPool) as Database
