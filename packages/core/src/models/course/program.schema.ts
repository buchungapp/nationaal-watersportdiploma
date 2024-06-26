import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { outputSchema as courseSelectschema } from './course.schema.js'
import { selectSchema as degreeSelectSchema } from './degree.schema.js'

export const insertSchema = createInsertSchema(s.program, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  title: (schema) => schema.title.trim(),
  degreeId: (schema) => schema.degreeId.uuid(),
})
  .omit({ disciplineId: true })
  .required({ courseId: true })

export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.program)

export const outputSchema = selectSchema
  .omit({ degreeId: true, disciplineId: true, courseId: true })
  .extend({
    degree: degreeSelectSchema,
    course: courseSelectschema,
  })

export type Output = z.output<typeof outputSchema>
