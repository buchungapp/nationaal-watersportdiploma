import * as db from '@nawadi/db'
import postgres from 'postgres'

export interface Context {
  database: db.Database
  [Symbol.asyncDispose]: () => Promise<void>
}

export interface ContextConfiguration {
  pgUri: string
}

export function createContext(configuration: ContextConfiguration): Context {
  const { pgUri } = configuration

  const sql = postgres(pgUri)
  const database = db.createDatabase(sql)
  const dispose = async () => {
    await sql.end()
  }
  return {
    database,
    [Symbol.asyncDispose]: dispose,
  }
}
