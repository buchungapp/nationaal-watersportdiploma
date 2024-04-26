import { schema as s } from '@nawadi/db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { successfulCreateResponse, withZod } from '../../utils/index.js'

export const find = withZod(
  z.object({
    handle: z.string(),
    issuedAt: z.string().datetime(),
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const [result] = await query
      .select()
      .from(s.certificate)
      .where(
        and(
          eq(s.certificate.handle, input.handle),
          eq(s.certificate.issuedAt, input.issuedAt),
        ),
      )

    if (!result) {
      throw new Error('Failed to find certificate')
    }

    return result
  },
)
