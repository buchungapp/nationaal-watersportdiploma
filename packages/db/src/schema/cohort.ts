import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { program } from './course.js'

export const cohort = pgTable(
  'cohort',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    revision: text('revision').notNull(),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'string',
    }),
    ...timestamps,
  },
  (table) => {
    return {
      programReference: foreignKey({
        columns: [table.programId],
        foreignColumns: [program.id],
        name: 'curriculum_program_id_fk',
      }),
      unqProgramRevision: uniqueIndex().on(table.programId, table.revision),
    }
  },
)
