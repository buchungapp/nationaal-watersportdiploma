import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const insertSchema = createInsertSchema(s.studentCurriculum, {
  personId: (schema) => schema.personId.uuid(),
  curriculumId: (schema) => schema.curriculumId.uuid(),
  gearTypeId: (schema) => schema.gearTypeId.uuid(),
  startedAt: (schema) => schema.startedAt.datetime(),
})

export const selectSchema = createSelectSchema(s.studentCurriculum)
