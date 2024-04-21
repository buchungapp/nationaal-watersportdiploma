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

export const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, schema.array()])

// Define function overloads
export function withZod<
  InputSchema extends z.ZodSchema<any, any, any>,
  Return extends any,
>(
  inputSchema: InputSchema,
  func: (value: z.output<InputSchema>) => Return,
): (input: z.input<InputSchema> | void) => Return

export function withZod<
  InputSchema extends z.ZodSchema<any, any, any>,
  OutputSchema extends z.ZodSchema<any, any, any>,
  Return extends any,
>(
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  func: (value: z.output<InputSchema>) => Promise<z.output<OutputSchema>>,
): (input: z.input<InputSchema> | void) => Promise<z.output<OutputSchema>>

// Implement the function
export function withZod<
  InputSchema extends z.ZodSchema<any, any, any>,
  OutputSchema extends z.ZodSchema<any, any, any> | undefined,
  Return extends any,
>(
  inputSchema: InputSchema,
  secondArgument: OutputSchema | ((value: z.output<InputSchema>) => Return),
  thirdArgument?: (
    value: z.output<InputSchema>,
  ) => OutputSchema extends z.ZodSchema<any, any, any>
    ? Promise<z.input<OutputSchema>>
    : never,
) {
  const func: any =
    typeof secondArgument === 'function' ? secondArgument : thirdArgument
  const outputSchema: OutputSchema | undefined =
    typeof secondArgument === 'function' ? undefined : secondArgument

  const result = (input: z.input<InputSchema> | void) => {
    const parsed = inputSchema.parse(input)
    const result = func(parsed)
    if (outputSchema) {
      return outputSchema.parse(result) // Validate the result if outputSchema is defined
    }
    return result
  }

  result.inputSchema = inputSchema
  if (outputSchema) {
    result.outputSchema = outputSchema
  }

  return result
}
