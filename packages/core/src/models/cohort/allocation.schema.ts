import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const insertSchema = createInsertSchema(s.cohortAllocation, {
  actorId: (schema) => schema.actorId.uuid(),
  cohortId: (schema) => schema.cohortId.uuid(),
  studentCurriculumId: (schema) => schema.studentCurriculumId.uuid(),
  tags: (schema) => schema.tags.array().default([]),
})
export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.cohortAllocation, {
  tags: (schema) => schema.tags.array(),
})

export type Output = z.output<typeof selectSchema>
