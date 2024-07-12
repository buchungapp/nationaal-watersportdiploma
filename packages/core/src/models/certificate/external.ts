import { schema as s } from '@nawadi/db'
import dayjs from 'dayjs'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../utils/index.js'

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
      metadata: z.record(z.string(), z.string()).nullable(),
    })
    .array(),
  async (input) => {
    const query = useQuery()

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
      )

    return certificates.map(({ external_certificate, location }) => ({
      id: external_certificate.id,
      createdAt: dayjs(external_certificate.createdAt).toISOString(),
      awardedAt: external_certificate.awardedAt
        ? dayjs(external_certificate.awardedAt).toISOString()
        : null,
      location: location ? location.name : null,
      identifier: external_certificate.identifier,
      metadata: external_certificate._metadata as any,
    }))
  },
)
