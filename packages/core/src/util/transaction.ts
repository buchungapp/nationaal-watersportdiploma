import { type ExtractTablesWithRelations } from 'drizzle-orm'
import { type PgTransaction } from 'drizzle-orm/pg-core'
import { type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

import type { Database, schema } from '@nawadi/db'
import { Context } from '@nawadi/lib/node'
import { getDatabase } from './db.js'

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

export type TxOrDb = Database | Transaction

const TransactionContext = Context.create<{
  tx: TxOrDb
}>('TransactionContext')

export async function useTransaction<T>(callback: (trx: TxOrDb) => Promise<T>) {
  try {
    const { tx } = TransactionContext.use()
    return callback(tx)
  } catch {
    return callback(getDatabase())
  }
}

export async function createTransaction<T>(
  callback: (tx: TxOrDb) => Promise<T>,
) {
  try {
    const { tx } = TransactionContext.use()
    return callback(tx)
  } catch {
    const db = getDatabase()

    const result = await db.transaction(
      async (tx) => {
        const result = await TransactionContext.with({ tx }, async () => {
          return callback(tx)
        })
        return result
      },
      {
        isolationLevel: 'serializable',
      },
    )
    return result
  }
}
