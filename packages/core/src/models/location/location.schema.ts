import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { outputSchema as mediaOutputSchema } from "../platform/media.schema.js";
export const insertSchema = createInsertSchema(s.location, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  name: (schema) => schema.name.trim(),
  websiteUrl: (schema) => schema.websiteUrl.url(),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.location, {
  _metadata: z.any(),
});

export const locationMetadataSchema = z.object({
  googlePlaceId: z
    .string()
    .nullable()
    .catch(() => null),
  socialMedia: z
    .object({
      platform: z.union([
        z.literal("facebook"),
        z.literal("instagram"),
        z.literal("linkedin"),
        z.literal("tiktok"),
        z.literal("whatsapp"),
        z.literal("x"),
        z.literal("youtube"),
      ]),
      url: z.string().url(),
    })
    .array()
    .catch(() => []),
  googlePlaceData: z
    .object({
      address_components: z.array(
        z.object({
          long_name: z.string(),
          short_name: z.string(),
          types: z.array(z.string()),
        }),
      ),
      geometry: z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        viewport: z.object({
          northeast: z.object({
            lat: z.number(),
            lng: z.number(),
          }),
          southwest: z.object({
            lat: z.number(),
            lng: z.number(),
          }),
        }),
      }),
      url: z.string().url(),
    })
    .nullable()
    .catch(() => null),
});

export type LocationMetadata = z.infer<typeof locationMetadataSchema>;

export const outputSchema = selectSchema
  .omit({
    logoMediaId: true,
    squareLogoMediaId: true,
    certificateMediaId: true,
    _metadata: true,
    status: true,
  })
  .extend({
    logo: mediaOutputSchema.nullable(),
    logoSquare: mediaOutputSchema.nullable(),
    logoCertificate: mediaOutputSchema.nullable(),
  })
  .merge(locationMetadataSchema);

export type Output = z.output<typeof outputSchema>;
