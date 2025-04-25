import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { Platform } from "../index.js";
import { outputSchema } from "../platform/media.schema.js";

export const byId = wrapQuery(
  "certificate.external.byId",
  withZod(
    z.object({
      id: uuidSchema,
    }),
    z.object({
      id: uuidSchema,
      personId: uuidSchema,
      createdAt: z.string().datetime(),
      identifier: z.string().nullable(),
      location: z.string().nullable(),
      awardedAt: z.string().datetime().nullable(),
      issuingAuthority: z.string().nullable(),
      title: z.string(),
      mediaId: z.string().nullable(),
      metadata: z.record(z.string(), z.string()).nullable(),
      media: outputSchema.nullable(),
      additionalComments: z.string().nullable(),
    }),
    async (input) => {
      const query = useQuery();

      const { external_certificate, location } = await query
        .select()
        .from(s.externalCertificate)
        .leftJoin(
          s.location,
          eq(s.location.id, s.externalCertificate.locationId),
        )
        .where(
          and(
            eq(s.externalCertificate.id, input.id),
            isNull(s.externalCertificate.deletedAt),
          ),
        )
        .then(singleRow);

      let media = null;
      if (external_certificate.mediaId) {
        media = await Platform.Media.fromId(external_certificate.mediaId);

        if (media) {
          media.url = await Platform.Media.createSignedUrl({
            id: external_certificate.mediaId,
            download: false,
          });
        }
      }

      return {
        id: external_certificate.id,
        personId: external_certificate.personId,
        createdAt: dayjs(external_certificate.createdAt).toISOString(),
        awardedAt: external_certificate.awardedAt
          ? dayjs(external_certificate.awardedAt).toISOString()
          : null,
        location: location
          ? location.name
          : (external_certificate.issuingLocation ?? null),
        identifier: external_certificate.identifier,
        issuingAuthority: external_certificate.issuingAuthority,
        title: external_certificate.title,
        mediaId: external_certificate.mediaId,
        additionalComments: external_certificate.additionalComments,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        metadata: external_certificate._metadata as any,
        media,
      };
    },
  ),
);

export const listForPerson = wrapQuery(
  "certificate.external.listForPerson",
  withZod(
    z.object({
      personId: uuidSchema,
    }),
    z
      .object({
        id: uuidSchema,
        createdAt: z.string().datetime(),
        identifier: z.string().nullable(),
        location: z.string().nullable(),
        awardedAt: z.string().datetime().nullable(),
        issuingAuthority: z.string().nullable(),
        title: z.string(),
        mediaId: z.string().nullable(),
        metadata: z.record(z.string(), z.string()).nullable(),
        media: outputSchema.nullable(),
        additionalComments: z.string().nullable(),
      })
      .array(),
    async (input) => {
      const query = useQuery();

      const certificates = await query
        .select()
        .from(s.externalCertificate)
        .leftJoin(
          s.location,
          eq(s.location.id, s.externalCertificate.locationId),
        )
        .where(
          and(
            eq(s.externalCertificate.personId, input.personId),
            isNull(s.externalCertificate.deletedAt),
          ),
        )
        .orderBy(
          desc(s.externalCertificate.awardedAt),
          desc(s.externalCertificate.createdAt),
        );

      return await Promise.all(
        certificates.map(async ({ external_certificate, location }) => {
          let media = null;
          if (external_certificate.mediaId) {
            media = await Platform.Media.fromId(external_certificate.mediaId);

            if (media) {
              media.url = await Platform.Media.createSignedUrl({
                id: external_certificate.mediaId,
                download: false,
              });
            }
          }

          return {
            id: external_certificate.id,
            createdAt: dayjs(external_certificate.createdAt).toISOString(),
            awardedAt: external_certificate.awardedAt
              ? dayjs(external_certificate.awardedAt).toISOString()
              : null,
            location: location
              ? location.name
              : (external_certificate.issuingLocation ?? null),
            identifier: external_certificate.identifier,
            issuingAuthority: external_certificate.issuingAuthority,
            title: external_certificate.title,
            mediaId: external_certificate.mediaId,
            additionalComments: external_certificate.additionalComments,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            metadata: external_certificate._metadata as any,
            media,
          };
        }),
      );
    },
  ),
);

export const create = wrapCommand(
  "certificate.external.create",
  withZod(
    z.object({
      personId: uuidSchema,
      identifier: z.string().nullable(),
      awardedAt: z.string().date().nullable(),
      issuingAuthority: z.string().nullable(),
      issuingLocation: z.string().nullable(),
      title: z.string(),
      mediaId: uuidSchema.nullable(),
      additionalComments: z.string().nullable(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const rows = await query
        .insert(s.externalCertificate)
        .values({
          personId: input.personId,
          identifier: input.identifier,
          awardedAt: input.awardedAt,
          issuingAuthority: input.issuingAuthority,
          issuingLocation: input.issuingLocation,
          title: input.title,
          mediaId: input.mediaId,
          additionalComments: input.additionalComments,
        })
        .returning({
          id: s.externalCertificate.id,
        });

      return singleRow(rows);
    },
  ),
);

export const update = wrapCommand(
  "certificate.external.update",
  withZod(
    z.object({
      id: uuidSchema,
      identifier: z.string().nullable().optional(),
      awardedAt: z.string().date().nullable().optional(),
      issuingAuthority: z.string().nullable().optional(),
      issuingLocation: z.string().nullable().optional(),
      title: z.string().optional(),
      mediaId: uuidSchema.nullable().optional(),
      additionalComments: z.string().nullable().optional(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const row = await query
        .update(s.externalCertificate)
        .set({
          identifier: input.identifier,
          awardedAt: input.awardedAt,
          issuingAuthority: input.issuingAuthority,
          issuingLocation: input.issuingLocation,
          title: input.title,
          mediaId: input.mediaId,
          additionalComments: input.additionalComments,
        })
        .where(
          and(
            eq(s.externalCertificate.id, input.id),
            isNull(s.externalCertificate.deletedAt),
          ),
        )
        .returning({ id: s.externalCertificate.id })
        .then(singleRow);

      return row;
    },
  ),
);

export const remove = wrapCommand(
  "certificate.external.remove",
  withZod(uuidSchema, z.void(), async (input) => {
    const query = useQuery();

    const { mediaId } = await query
      .select({
        mediaId: s.externalCertificate.mediaId,
      })
      .from(s.externalCertificate)
      .where(
        and(
          eq(s.externalCertificate.id, input),
          isNull(s.externalCertificate.deletedAt),
        ),
      )
      .then(singleRow);

    if (mediaId) {
      await Platform.Media.remove(mediaId);
    }

    await query
      .update(s.externalCertificate)
      .set({
        deletedAt: sql`NOW()`,
      })
      .where(and(eq(s.externalCertificate.id, input)));
  }),
);
