import { schema as s } from "@nawadi/db";
import {
  and,
  asc,
  eq,
  isNotNull,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { findItem, singleRow } from "../../utils/data-helpers.js";
import { wrapCommand, wrapQuery } from "../../utils/index.js";
import {
  handleSchema,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/zod.js";
import { selectSchema as disciplineSelectSchema } from "../course/discipline.schema.js";
import { selectSchema as gearTypeSelectSchema } from "../curriculum/gear-type.schema.js";
import { Platform } from "../index.js";
import {
  type LocationMetadata,
  insertSchema,
  locationMetadataSchema,
  outputSchema,
} from "./location.schema.js";

function mapMetaForLocation(metadata: unknown): LocationMetadata {
  return locationMetadataSchema.parse(metadata ?? {});
}

export const create = wrapCommand(
  "location.create",
  withZod(
    insertSchema.pick({
      handle: true,
      name: true,
      websiteUrl: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();
      const [insert] = await query
        .insert(s.location)
        .values({
          ...input,
        })
        .returning({ id: s.location.id });

      if (!insert) {
        throw new Error("Failed to insert location");
      }

      return insert;
    },
  ),
);

export const updateDetails = wrapCommand(
  "location.updateDetails",
  withZod(
    insertSchema
      .pick({
        id: true,
        name: true,
        websiteUrl: true,
        email: true,
        shortDescription: true,
        logoMediaId: true,
        squareLogoMediaId: true,
        certificateMediaId: true,
      })
      .extend({
        googlePlaceId: z.string().nullish(),
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
          .array(),
      })
      .partial()
      .required({ id: true }),
    z.void(),
    async (input) => {
      const query = useQuery();

      const existing = await query
        .select()
        .from(s.location)
        .where(eq(s.location.id, input.id))
        .then(singleRow);

      await query
        .update(s.location)
        .set({
          name: input.name,
          websiteUrl: input.websiteUrl,
          email: input.email,
          shortDescription: input.shortDescription,
          _metadata: sql`(((${JSON.stringify({
            ...(existing._metadata as JSON),
            ...(input.googlePlaceId !== undefined && {
              googlePlaceId: input.googlePlaceId,
            }),
            ...(input.socialMedia !== undefined && {
              socialMedia: input.socialMedia,
            }),
          })})::jsonb)#>> '{}')::jsonb`,
          logoMediaId: input.logoMediaId,
          squareLogoMediaId: input.squareLogoMediaId,
          certificateMediaId: input.certificateMediaId,
        })
        .where(eq(s.location.id, input.id));
    },
  ),
);

export const list = wrapQuery(
  "location.list",
  withZod(z.void(), outputSchema.array(), async () => {
    const query = useQuery();
    const locations = await query
      .select()
      .from(s.location)
      .where(eq(s.location.status, "active"))
      .orderBy(asc(s.location.name));

    // const uniqueMediaIds = Array.from(
    //   new Set(
    //     locations
    //       .map((row) => [
    //         row.logoMediaId,
    //         row.squareLogoMediaId,
    //         row.certificateMediaId,
    //       ])
    //       .flat(),
    //   ),
    // ).filter((id): id is string => !!id)

    const allImages = await Platform.Media.listImages();

    return locations.map((row) => {
      const logo = row.logoMediaId
        ? findItem({
            items: allImages,
            predicate: (media) => media.id === row.logoMediaId,
            enforce: true,
          })
        : null;

      const logoSquare = row.squareLogoMediaId
        ? findItem({
            items: allImages,
            predicate: (media) => media.id === row.squareLogoMediaId,
            enforce: true,
          })
        : null;

      const logoCertificate = row.certificateMediaId
        ? findItem({
            items: allImages,
            predicate: (media) => media.id === row.certificateMediaId,
            enforce: true,
          })
        : null;

      return {
        ...row,
        logo,
        logoSquare,
        logoCertificate,
        ...mapMetaForLocation(row._metadata),
      };
    });
  }),
);

export const fromId = wrapQuery(
  "location.fromId",
  withZod(uuidSchema, outputSchema, async (id) => {
    const query = useQuery();
    const location = await query
      .select()
      .from(s.location)
      .where(eq(s.location.id, id))
      .then((rows) => singleRow(rows));

    const [logo, squareLogo, certificateLogo] = await Promise.all([
      location.logoMediaId ? Platform.Media.fromId(location.logoMediaId) : null,
      location.squareLogoMediaId
        ? Platform.Media.fromId(location.squareLogoMediaId)
        : null,
      location.certificateMediaId
        ? Platform.Media.fromId(location.certificateMediaId)
        : null,
    ]);

    return {
      ...location,
      logo,
      logoSquare: squareLogo,
      logoCertificate: certificateLogo,
      ...mapMetaForLocation(location._metadata),
    };
  }),
);

export const fromHandle = wrapQuery(
  "location.fromHandle",
  withZod(handleSchema, outputSchema, async (handle) => {
    const query = useQuery();

    const location = await query
      .select()
      .from(s.location)
      .where(eq(s.location.handle, handle))
      .then((rows) => singleRow(rows));

    const [logo, squareLogo, certificateLogo] = await Promise.all([
      location.logoMediaId ? Platform.Media.fromId(location.logoMediaId) : null,
      location.squareLogoMediaId
        ? Platform.Media.fromId(location.squareLogoMediaId)
        : null,
      location.certificateMediaId
        ? Platform.Media.fromId(location.certificateMediaId)
        : null,
    ]);

    return {
      ...location,
      logo,
      logoSquare: squareLogo,
      logoCertificate: certificateLogo,
      ...mapMetaForLocation(location._metadata),
    };
  }),
);

export const listResources = wrapQuery(
  "location.listResources",
  withZod(
    uuidSchema,
    z.object({
      gearTypes: z
        .object({
          id: z.string(),
          locationId: z.string(),
          gearType: gearTypeSelectSchema,
        })
        .array(),
      disciplines: z
        .object({
          id: z.string(),
          locationId: z.string(),
          discipline: disciplineSelectSchema,
        })
        .array(),
    }),
    async (locationId) => {
      const query = useQuery();

      const rows = await query
        .select()
        .from(s.locationResourceLink)
        .leftJoin(
          s.gearType,
          eq(s.locationResourceLink.gearTypeId, s.gearType.id),
        )
        .leftJoin(
          s.discipline,
          eq(s.locationResourceLink.disciplineId, s.discipline.id),
        )
        .where(
          and(
            eq(s.locationResourceLink.locationId, locationId),
            isNull(s.locationResourceLink.deletedAt),
          ),
        );

      const gearTypes = rows
        .filter((row) => row.gear_type)
        .map((row) => ({
          id: row.location_resource_link.id,
          locationId: row.location_resource_link.locationId,
          // biome-ignore lint/style/noNonNullAssertion: Filtering ensures this is not null
          gearType: row.gear_type!,
        }));

      const disciplines = rows
        .filter((row) => row.discipline)
        .map((row) => ({
          id: row.location_resource_link.id,
          locationId: row.location_resource_link.locationId,
          // biome-ignore lint/style/noNonNullAssertion: Filtering ensures this is not null
          discipline: row.discipline!,
        }));

      return {
        gearTypes,
        disciplines,
      };
    },
  ),
);

export const updateResources = wrapCommand(
  "location.updateResources",
  withZod(
    z.object({
      id: uuidSchema,
      gearTypes: z.array(uuidSchema),
      disciplines: z.array(uuidSchema),
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .delete(s.locationResourceLink)
        .where(
          and(
            eq(s.locationResourceLink.locationId, input.id),
            or(
              and(
                isNotNull(s.locationResourceLink.gearTypeId),
                notInArray(s.locationResourceLink.gearTypeId, input.gearTypes),
              ),
              and(
                isNotNull(s.locationResourceLink.disciplineId),
                notInArray(
                  s.locationResourceLink.disciplineId,
                  input.disciplines,
                ),
              ),
            ),
          ),
        );

      const gearTypes = input.gearTypes.map((gearTypeId) => ({
        locationId: input.id,
        gearTypeId,
        disciplineId: null,
      }));

      const disciplines = input.disciplines.map((disciplineId) => ({
        locationId: input.id,
        gearTypeId: null,
        disciplineId,
      }));

      await Promise.all([
        gearTypes.length > 0 &&
          query
            .insert(s.locationResourceLink)
            .values(gearTypes)
            .onConflictDoNothing({
              target: [
                s.locationResourceLink.locationId,
                s.locationResourceLink.gearTypeId,
              ],
            }),
        disciplines.length > 0 &&
          query
            .insert(s.locationResourceLink)
            .values(disciplines)
            .onConflictDoNothing({
              target: [
                s.locationResourceLink.locationId,
                s.locationResourceLink.disciplineId,
              ],
            }),
      ]);
    },
  ),
);
