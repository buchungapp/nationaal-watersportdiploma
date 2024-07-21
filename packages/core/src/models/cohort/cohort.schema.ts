import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const insertSchema = createInsertSchema(s.cohort, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  label: (schema) => schema.label.trim(),
  locationId: (schema) => schema.locationId.uuid(),
})
export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.cohort).omit({
  _metadata: true,
})

export type Output = z.output<typeof selectSchema>
