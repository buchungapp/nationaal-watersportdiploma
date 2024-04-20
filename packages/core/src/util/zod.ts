import { z } from 'zod'

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .regex(/^[a-z0-9\-]+$/)
export type Handle = z.infer<typeof handleSchema>

export const titleSchema = z.string().trim()
export type Title = z.infer<typeof titleSchema>

export const uuidSchema = z.string().uuid()
export type UUID = z.infer<typeof uuidSchema>

/** A string representation (ISO 8601 format) of a date.
 * @example "2021-01-01T00:00:00.000Z"
 */
export const dateTimeSchema = z.string().datetime({ offset: true })
export type DateTime = z.infer<typeof dateTimeSchema>

export function withZod<
  Schema extends z.ZodSchema<any, any, any>,
  Return extends any,
>(schema: Schema, func: (value: z.infer<Schema>) => Return) {
  const result = (input: z.infer<Schema>) => {
    const parsed = schema.parse(input)
    return func(parsed)
  }
  result.schema = schema
  return result
}
