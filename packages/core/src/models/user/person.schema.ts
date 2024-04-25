import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const insertSchema = createInsertSchema(s.person, {
  firstName: (schema) => schema.firstName.trim(),
  lastName: (schema) => schema.lastName.trim(),
  lastNamePrefix: (schema) => schema.lastNamePrefix.trim(),
  dateOfBirth: (schema) => schema.dateOfBirth.pipe(z.coerce.date()),
  birthCountry: (schema) =>
    schema.birthCountry.length(2).toLowerCase().default('nl'),
})
export const selectSchema = createSelectSchema(s.person)
