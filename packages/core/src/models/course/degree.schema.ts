import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const insertSchema = createInsertSchema(s.degree, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  title: (schema) => schema.title.trim(),
  rang: (schema) => schema.rang.int().positive(),
})
export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.degree)
export type Output = z.output<typeof selectSchema>
