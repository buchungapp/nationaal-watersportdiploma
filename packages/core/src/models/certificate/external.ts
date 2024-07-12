import { schema as s } from '@nawadi/db'
import dayjs from 'dayjs'
import { and, asc, eq, isNull } from 'drizzle-orm'
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
      metadata: z.record(z.string(), z.string()).nullable(),
    })
    .array(),
  async (input) => {
    const query = useQuery()

    const certificates = await query
      .select()
      .from(s.externalCertificate)
      .where(
        and(
          eq(s.externalCertificate.personId, input.personId),
          isNull(s.externalCertificate.deletedAt),
        ),
      )
      .orderBy(asc(s.externalCertificate.createdAt))

    return certificates.map((certificate) => ({
      id: certificate.id,
      createdAt: dayjs(certificate.createdAt).toISOString(),
      identifier: certificate.identifier,
      metadata: certificate._metadata as any,
    }))
  },
)
