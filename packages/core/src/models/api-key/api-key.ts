import { schema as s } from '@nawadi/db'
import { and, eq, isNull, lte, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { hashToken } from '../../utils/crypto.js'
import { possibleSingleRow, singleRow, withZod } from '../../utils/index.js'

export const createForUser = withZod(
  z.object({
    name: z.string(),
    userId: z.string(),
  }),
  z.object({
    id: z.string(),
    token: z.string(),
  }),
  async (input) => {
    const query = useQuery()
    const token = nanoid(24)

    const hashedKey = hashToken(token)
    // take first 2 and last 4 characters of the key
    const partialKey = `${token.slice(0, 2)}...${token.slice(-4)}`

    const row = await query
      .insert(s.token)
      .values({
        hashedKey,
        partialKey,
        name: input.name,
        userId: input.userId,
      })
      .returning({ id: s.token.id })
      .then(singleRow)

    return row as { id: string; token: string }
  },
)

export const byToken = withZod(
  z.string(),
  z.object({
    id: z.string(),
    userId: z.string(),
  }),
  async (token) => {
    const query = useQuery()

    const hashedKey = hashToken(token)

    const row = await query
      .select()
      .from(s.token)
      .where(
        and(
          eq(s.token.hashedKey, hashedKey),
          isNull(s.token.deletedAt),
          or(
            isNull(s.token.expires),
            lte(s.token.expires, new Date().toISOString()),
          ),
        ),
      )
      .then(possibleSingleRow)

    if (row != null && row.userId === null) {
      throw new Error('Unassociated tokens are not supported at this time.')
    }

    return row as { id: string; userId: string }
  },
)
