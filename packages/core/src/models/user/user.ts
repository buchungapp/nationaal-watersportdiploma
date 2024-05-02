import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { createAuthUser } from '../../services/auth/handlers.js'
import { singleRow, uuidSchema, withZod } from '../../utils/index.js'
import { selectSchema } from './user.schema.js'

export const getOrCreateFromEmail = withZod(
  z.object({
    email: z.string().trim().toLowerCase().email(),
    displayName: z.string().optional(),
  }),
  z.object({
    id: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const [existing] = await query
      .select({ authUserId: s.user.authUserId })
      .from(s.user)
      .where(eq(s.user.email, input.email))

    if (existing) {
      return {
        id: existing.authUserId,
      }
    }

    const newAuthUserId = await createAuthUser({ email: input.email })

    const [newUser] = await query
      .insert(s.user)
      .values({
        authUserId: newAuthUserId,
        email: input.email,
        displayName: input.displayName,
      })
      .returning({ authUserId: s.user.authUserId })

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    return {
      id: newUser.authUserId,
    }
  },
)

export const fromId = withZod(
  uuidSchema,
  selectSchema.nullable(),
  async (id) => {
    const query = useQuery()

    return (await query
      .select()
      .from(s.user)
      .where(eq(s.user.authUserId, id))
      .then(singleRow)) as any // Metadata does not match the type,  but we have Zod to validate
  },
)
