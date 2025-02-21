import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/index.js";

export const listForPerson = withZod(
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
    })
    .array(),
  async (input) => {
    const query = useQuery();

    const certificates = await query
      .select()
      .from(s.externalCertificate)
      .leftJoin(s.location, eq(s.location.id, s.externalCertificate.locationId))
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

    return certificates.map(({ external_certificate, location }) => ({
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
    }));
  },
);

export const create = withZod(
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
);
