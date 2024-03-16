import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import * as pg from 'pg'
import * as schema from './schema/index.js'

export type Database = NodePgDatabase<typeof schema>
export function createDatabase(pgPool: pg.Pool) {
  const db = drizzle(pgPool, { schema })
  return db
}
