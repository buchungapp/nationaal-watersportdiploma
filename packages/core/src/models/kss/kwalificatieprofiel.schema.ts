import { schema as s } from "@nawadi/db";
import { z } from "zod";
import { uuidSchema } from "../../utils/index.js";

export const richtingSchema = z.enum(s.richting.enumValues);

// Output schema for niveau
export const niveauOutputSchema = z.object({
  id: uuidSchema,
  rang: z.number(),
});

// Output schema for kerntaak onderdeel
export const kerntaakOnderdeelOutputSchema = z.object({
  id: uuidSchema,
  type: z.enum(["portfolio", "praktijk"]),
});

// Output schema for kerntaak with onderdelen
export const kerntaakWithOnderdelenOutputSchema = z.object({
  id: uuidSchema,
  titel: z.string(),
  type: z.enum(["verplicht", "facultatief"]),
  rang: z.number().nullable(),
  onderdelen: kerntaakOnderdeelOutputSchema.array(),
});

// Output schema for kwalificatieprofiel with kerntaken and onderdelen
export const kwalificatieprofielWithOnderdelenOutputSchema = z.object({
  id: uuidSchema,
  titel: z.string(),
  richting: richtingSchema,
  niveau: niveauOutputSchema,
  kerntaken: kerntaakWithOnderdelenOutputSchema.array(),
});

// Input schema for list operation
export const listKwalificatieprofielenSchema = z
  .object({
    filter: z
      .object({
        id: uuidSchema.optional(),
        richting: richtingSchema.optional(),
        niveauId: uuidSchema.optional(),
      })
      .default({}),
  })
  .default({});

// Output schema for individual kwalificatieprofiel
export const kwalificatieprofielOutputSchema = z.object({
  id: uuidSchema,
  titel: z.string(),
  richting: richtingSchema,
  niveau: z.object({
    id: uuidSchema,
    rang: z.number(),
  }),
});
