import { type ZodEffects, type ZodString, type ZodTypeAny, z } from "zod";

type InputType<DefaultType extends ZodTypeAny> = {
  (): ZodEffects<DefaultType>;
  <ProvidedType extends ZodTypeAny>(
    schema: ProvidedType,
  ): ZodEffects<ProvidedType>;
};

export const dateInput = z.string().pipe(z.coerce.date());

export const dateInputToIsoString: InputType<ZodString> = (
  schema = z.string().datetime(),
) =>
  z
    .string()
    .nullish()
    .pipe(
      z.coerce
        .date()
        .nullish()
        .transform((value) => value?.toISOString())
        .pipe(schema),
      // biome-ignore lint/suspicious/noExplicitAny: No other way to convert the type
    ) as any;
