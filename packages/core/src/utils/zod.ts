import { z } from "zod";

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .regex(/^[a-z0-9\-]+$/);
export type Handle = z.infer<typeof handleSchema>;

export const uuidSchema = z.string().uuid();
export type UUID = z.infer<typeof uuidSchema>;

export const idOrHandleSchema = z.union([
  z.object({ id: uuidSchema }),
  z.object({ handle: handleSchema }),
]);
export type IdOrHandle = z.infer<typeof idOrHandleSchema>;

export const titleSchema = z.string().trim();
export type Title = z.infer<typeof titleSchema>;

/** A string representation (ISO 8601 format) of a date.
 * @example "2021-01-01T00:00:00.000Z"
 */
export const dateTimeSchema = z.string().datetime({ offset: true });
export type DateTime = z.infer<typeof dateTimeSchema>;

export const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, schema.array()]);

export const successfulCreateResponse = z.object({
  id: uuidSchema,
});

// Define function overloads
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function withZod<InputSchema extends z.ZodSchema<any, any, any>, Return>(
  inputSchema: InputSchema,
  func: (value: z.output<InputSchema>) => Return,
): (input: z.input<InputSchema> | undefined) => Return;

export function withZod<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  InputSchema extends z.ZodSchema<any, any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  OutputSchema extends z.ZodSchema<any, any, any>,
  Return,
>(
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  func: (value: z.output<InputSchema>) => Promise<z.output<OutputSchema>>,
): (input: z.input<InputSchema> | undefined) => Promise<z.output<OutputSchema>>;

// Implement the function
export function withZod<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  InputSchema extends z.ZodSchema<any, any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  OutputSchema extends z.ZodSchema<any, any, any> | undefined,
  Return,
>(
  inputSchema: InputSchema,
  secondArgument: OutputSchema | ((value: z.output<InputSchema>) => Return),
  thirdArgument?: (
    value: z.output<InputSchema>,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => OutputSchema extends z.ZodSchema<any, any, any>
    ? Promise<z.input<OutputSchema>>
    : never,
) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const func: any =
    typeof secondArgument === "function" ? secondArgument : thirdArgument;
  const outputSchema: OutputSchema | undefined =
    typeof secondArgument === "function" ? undefined : secondArgument;

  const result = async (input: z.input<InputSchema> | undefined) => {
    const parsed = inputSchema.parse(input);
    const result = await func(parsed);
    if (outputSchema) {
      return outputSchema.parse(result); // Validate the result if outputSchema is defined
    }
    return result;
  };

  result.inputSchema = inputSchema;
  if (outputSchema) {
    result.outputSchema = outputSchema;
  }

  return result;
}
