import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { outputSchema as studentCurriculumSelectSchema } from '../student/curriculum.schema.js'
import { selectSchema as actorSelectSchema } from '../user/actor.schema.js'

export const insertSchema = createInsertSchema(s.cohortAllocation, {
  actorId: (schema) => schema.actorId.uuid(),
  cohortId: (schema) => schema.cohortId.uuid(),
  studentCurriculumId: (schema) => schema.studentCurriculumId.uuid(),
  tags: (schema) => schema.tags.array().default([]),
})
export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.cohortAllocation)

export const outputSchema = selectSchema
  .omit({ actorId: true, studentCurriculumId: true })
  .extend({
    actor: actorSelectSchema,
    studentCurriculum: studentCurriculumSelectSchema,
  })

export type Output = z.output<typeof outputSchema>
