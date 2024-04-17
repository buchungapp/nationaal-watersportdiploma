import assert from 'assert'
import { sql } from 'drizzle-orm'
import test from 'node:test'
import { useQuery } from './query.js'
import { withTestTransaction } from './transaction.js'

test('with-test-transaction', () =>
  withTestTransaction(async () => {
    const query = useQuery()

    const result = await query.execute(sql`SELECT 1 as one`)
    assert.deepEqual(result, [
      {
        one: 1,
      },
    ])
  }))
