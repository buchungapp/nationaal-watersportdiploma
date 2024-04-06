import assert from 'assert'
import { sql } from 'drizzle-orm'
import test from 'node:test'
import { withDatabase } from './database.js'

test('with-database', () =>
  withDatabase(async ({ db }) => {
    const result = await db.execute(sql`SELECT 1 as one;`)

    assert.deepEqual(result, [{ one: 1 }])
  }))
