import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { outputSchema as categorySelectSchema } from './category.schema.js'
import { selectSchema as degreeSelectSchema } from './degree.schema.js'
import { selectSchema as disciplineSelectSchema } from './discipline.schema.js'

export const insertSchema = createInsertSchema(s.program, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  title: (schema) => schema.title.trim(),
  disciplineId: (schema) => schema.disciplineId.uuid(),
  degreeId: (schema) => schema.degreeId.uuid(),
})
export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.program)

export const outputSchema = selectSchema
  .omit({ degreeId: true, disciplineId: true })
  .extend({
    degree: degreeSelectSchema,
    discipline: disciplineSelectSchema,
    categories: categorySelectSchema.array(),
  })

export type Output = z.output<typeof outputSchema>
