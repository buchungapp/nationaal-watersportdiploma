import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { Sql } from 'postgres'
import * as schema from './schema/index.js'

export type Database = PostgresJsDatabase<typeof schema>
export function createDatabase(pgPool: Sql<{}>) {
  const db = drizzle(pgPool, {
    schema,
    logger: process.env.DRIZZLE_LOG === 'true',
  })
  return db
}
