import assert from 'assert'
import { sql } from 'drizzle-orm'
import test from 'node:test'
import { useDatabase, withTestDatabase } from './database.js'

test('with-database', () =>
  withTestDatabase(async () => {
    const database = useDatabase()

    const result = await database.execute(sql`SELECT 1 as one`)
    assert.deepEqual(result, [
      {
        one: 1,
      },
    ])
  }))
