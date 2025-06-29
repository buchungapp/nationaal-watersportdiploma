import { z } from "zod";
import { uuidSchema } from "../../utils/index.js";

export const richtingSchema = z.enum([
  "trainer-coach",
  "instructeur",
  "official",
  "opleider",
]);

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
