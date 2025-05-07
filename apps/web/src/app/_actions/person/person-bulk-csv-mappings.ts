import { z } from "zod";

export const COLUMN_MAPPING = [
  "E-mailadres",
  "Voornaam",
  "Tussenvoegsels",
  "Achternaam",
  "Geboortedatum",
  "Geboorteplaats",
  "Geboorteland",
] as const;

export const COLUMN_MAPPING_WITH_TAG = [...COLUMN_MAPPING, "Tag"] as const;

export const SELECT_LABEL = "Niet importeren";

export const csvDataSchema = z.object({
  labels: z
    .array(
      z.object({
        label: z.string(),
        value: z.array(z.string().nullish()),
      }),
    )
    .nullable(),
  rows: z.array(z.array(z.string())).nullable(),
});

export type CSVData = z.infer<typeof csvDataSchema>;

export const countriesSchema = z
  .object({
    code: z.string(),
    name: z.string(),
  })
  .array();

export const csvColumnLiteral = z.custom<`include-column-${number}`>((val) =>
  /^include-column-\d+$/.test(val as string),
);
