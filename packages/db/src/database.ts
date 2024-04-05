import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

export type Database = PostgresJsDatabase<typeof schema>
export function createDatabase(pgPool: postgres.Sql<{}>) {
  const db = drizzle(pgPool, { schema })
  return db
}
