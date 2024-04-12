import * as z from 'zod'
import { extendZodWithOpenApi } from 'zod-openapi'

extendZodWithOpenApi(z)

export { z as openApiZ }

export function zod<
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
