import { z } from "zod";

export const COLUMN_MAPPING = [
  "E-mailadres",
  "Voornaam",
  "Tussenvoegsels",
  "Achternaam",
  "Geboortedatum",
  "Geboorteplaats",
  "Geboorteland",
  "Tag",
] as const;

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
