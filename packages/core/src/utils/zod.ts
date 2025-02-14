import { SpanStatusCode, trace } from "@opentelemetry/api";
import { type ZodError, z } from "zod";

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

const test = z
  .object({
    filter: z
      .object({
        id: singleOrArray(uuidSchema).optional(),
        number: singleOrArray(z.string().length(10)).optional(),
        locationId: singleOrArray(uuidSchema).optional(),
        personId: singleOrArray(uuidSchema).optional(),
        issuedAfter: z.string().datetime().optional(),
        issuedBefore: z.string().datetime().optional(),
      })
      .default({}),
  })
  .default({});

const a: z.input<typeof test> = undefined;

export function withZod<
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  TInput extends z.ZodType<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  TOutput extends z.ZodType<any, any>,
  F extends (input: z.output<TInput>) => Promise<z.input<TOutput>>,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  func: F,
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
): TInput extends z.ZodDefault<any>
  ? (input?: z.input<TInput>) => Promise<z.output<TOutput>>
  : (input: z.input<TInput>) => Promise<z.output<TOutput>>;

export function withZod<
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  TInput extends z.ZodType<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  F extends (input: z.output<TInput>) => any,
>(
  inputSchema: TInput,
  func: F,
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
): TInput extends z.ZodDefault<any>
  ? (input?: z.input<TInput>) => ReturnType<F>
  : (input: z.input<TInput>) => ReturnType<F>;

export function withZod<
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  TInput extends z.ZodType<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  TOutput extends z.ZodType<any, any>,
  F extends (input: z.output<TInput>) => Promise<z.input<TOutput>>,
>(
  inputSchema: TInput,
  outputSchemaOrFunc: TOutput | F,
  maybeFunc?: F,
): (input: z.input<TInput>) => Promise<z.output<TOutput>> {
  const func = maybeFunc || (outputSchemaOrFunc as F);
  const outputSchema = maybeFunc ? (outputSchemaOrFunc as TOutput) : undefined;

  const wrappedFunc = async (...args: Parameters<F>) => {
    const tracer = trace.getTracer("withZod");

    return await tracer.startActiveSpan("withZod", async (span) => {
      try {
        const input = args.length > 0 ? args[0] : undefined;

        let parsedInput: z.output<TInput> | undefined;
        await tracer.startActiveSpan("inputParsing", async (inputSpan) => {
          try {
            parsedInput = await inputSchema.parseAsync(input);
            inputSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            inputSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: (error as ZodError).message,
            });
            throw error;
          } finally {
            inputSpan.end();
          }
        });

        if (parsedInput === undefined) {
          throw new Error("Failed to parse input");
        }

        const result = await func(parsedInput);

        if (outputSchema) {
          return await tracer.startActiveSpan(
            "outputParsing",
            async (outputSpan) => {
              try {
                const parsedOutput = await outputSchema.parseAsync(result);
                outputSpan.setStatus({ code: SpanStatusCode.OK });
                return parsedOutput;
              } catch (error) {
                outputSpan.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: (error as ZodError).message,
                });
                throw error;
              } finally {
                outputSpan.end();
              }
            },
          );
        }

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  };

  // Preserve the original function's properties
  Object.assign(wrappedFunc, func);

  // Add schema information
  // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
  (wrappedFunc as any).inputSchema = inputSchema;
  if (outputSchema) {
    // biome-ignore lint/suspicious/noExplicitAny: Explicit any is required for zod to work
    (wrappedFunc as any).outputSchema = outputSchema;
  }

  return wrappedFunc as F;
}
