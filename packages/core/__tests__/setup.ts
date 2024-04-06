import { afterAll, beforeAll } from 'bun:test'
import postgres from 'postgres'

beforeAll(async () => {
  if (process.env.PGURI == null) {
    throw new Error('PGURI is not set')
  }

  const pgUri = new URL(process.env.PGURI)

  // use a single connection pool for the migration
  const sql = postgres(pgUri.toString(), {
    max: 1,
    onnotice(notice) {
      return
    },
  })

  try {
    // Truncate all tables in public schema
    await sql`
      DO
      $$
      DECLARE
        _sql TEXT;
      BEGIN
        FOR _sql IN
          SELECT 'TRUNCATE TABLE ' || schemaname || '.' || tablename || ' CASCADE;'
          FROM pg_tables
          WHERE schemaname = 'public'
        LOOP
          EXECUTE _sql;
        END LOOP;
      END
      $$
    `
  } finally {
    await sql.end({ timeout: 0 })
  }
})

afterAll(() => {
  // global teardown
})
