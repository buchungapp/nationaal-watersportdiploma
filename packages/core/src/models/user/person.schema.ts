import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { uuidSchema } from "../../utils/index.js";

export const insertSchema = createInsertSchema(s.person, {
  firstName: (schema) => schema.firstName.trim(),
  lastName: (schema) => schema.lastName.trim(),
  lastNamePrefix: (schema) => schema.lastNamePrefix.trim(),
  dateOfBirth: (schema) => schema.dateOfBirth.pipe(z.coerce.date()),
  birthCountry: (schema) =>
    schema.birthCountry.length(2).toLowerCase().default("nl"),
});
export const selectSchema = createSelectSchema(s.person);

export const personSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema.nullable(),
  handle: z.string(),
  email: z.string().email().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  lastNamePrefix: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  birthCity: z.string().nullable(),
  birthCountry: z
    .object({
      name: z.string(),
      code: z.string().length(2),
    })
    .nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
