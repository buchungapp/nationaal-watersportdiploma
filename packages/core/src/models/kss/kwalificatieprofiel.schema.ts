import { schema as s } from "@nawadi/db";
import { z } from "zod";
import { uuidSchema } from "../../utils/index.js";

export const richtingSchema = z.enum(s.richting.enumValues);

// Output schema for niveau
export const niveauOutputSchema = z.object({
  id: uuidSchema,
  rang: z.number().int().positive(),
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
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
  niveau: niveauOutputSchema,
});

// Mutation schemas
export const createKwalificatieprofielSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht"),
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
  niveauId: uuidSchema,
});

export const createKwalificatieprofielOutputSchema = z.object({
  id: uuidSchema,
});

export const updateKwalificatieprofielSchema = z.object({
  id: uuidSchema,
  titel: z.string().min(1, "Titel is verplicht").optional(),
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]).optional(),
  niveauId: uuidSchema.optional(),
});

export const updateKwalificatieprofielOutputSchema = z.object({
  success: z.boolean(),
});

export const deleteKwalificatieprofielSchema = z.object({
  id: uuidSchema,
});

export const deleteKwalificatieprofielOutputSchema = z.object({
  success: z.boolean(),
});

// Kerntaak schemas
export const createKerntaakSchema = z.object({
  kwalificatieprofielId: uuidSchema,
  titel: z.string().min(1, "Titel is verplicht"),
  type: z.enum(["verplicht", "facultatief"]),
  rang: z.number().int().nullable().optional(),
});

export const createKerntaakOutputSchema = z.object({
  id: uuidSchema,
});

export const updateKerntaakSchema = z.object({
  id: uuidSchema,
  titel: z.string().min(1, "Titel is verplicht").optional(),
  type: z.enum(["verplicht", "facultatief"]).optional(),
  rang: z.number().int().nullable().optional(),
});

export const updateKerntaakOutputSchema = z.object({
  success: z.boolean(),
});

export const deleteKerntaakSchema = z.object({
  id: uuidSchema,
});

export const deleteKerntaakOutputSchema = z.object({
  success: z.boolean(),
});

// Kerntaak onderdeel schemas
export const createKerntaakOnderdeelSchema = z.object({
  kerntaakId: uuidSchema,
  type: z.enum(["portfolio", "praktijk"]),
});

export const createKerntaakOnderdeelOutputSchema = z.object({
  id: uuidSchema,
});

export const deleteKerntaakOnderdeelSchema = z.object({
  id: uuidSchema,
});

export const deleteKerntaakOnderdeelOutputSchema = z.object({
  success: z.boolean(),
});

// Werkproces schemas
export const createWerkprocesSchema = z.object({
  kerntaakId: uuidSchema,
  titel: z.string().min(1, "Titel is verplicht"),
  resultaat: z.string().min(1, "Resultaat is verplicht"),
  rang: z.number().int().positive(),
});

export const createWerkprocesOutputSchema = z.object({
  id: uuidSchema,
});

export const updateWerkprocesSchema = z.object({
  id: uuidSchema,
  titel: z.string().min(1, "Titel is verplicht").optional(),
  resultaat: z.string().min(1, "Resultaat is verplicht").optional(),
  rang: z.number().int().positive().optional(),
});

export const updateWerkprocesOutputSchema = z.object({
  success: z.boolean(),
});

export const deleteWerkprocesSchema = z.object({
  id: uuidSchema,
});

export const deleteWerkprocesOutputSchema = z.object({
  success: z.boolean(),
});

// Beoordelingscriterium schemas
export const createBeoordelingscriteriumSchema = z.object({
  werkprocesId: uuidSchema,
  omschrijving: z.string().min(1, "Omschrijving is verplicht"),
  rang: z.number().int().nullable().optional(),
});

export const createBeoordelingscriteriumOutputSchema = z.object({
  id: uuidSchema,
});

export const updateBeoordelingscriteriumSchema = z.object({
  id: uuidSchema,
  omschrijving: z.string().min(1, "Omschrijving is verplicht").optional(),
  rang: z.number().int().nullable().optional(),
});

export const updateBeoordelingscriteriumOutputSchema = z.object({
  success: z.boolean(),
});

export const deleteBeoordelingscriteriumSchema = z.object({
  id: uuidSchema,
});

export const deleteBeoordelingscriteriumOutputSchema = z.object({
  success: z.boolean(),
});
