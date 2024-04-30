import { schema as s } from '@nawadi/db'
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { createAuthUser } from '../../services/auth/handlers.js'
import { uuidSchema, withZod } from '../../utils/index.js'
import { listActiveTypesForUser } from './actor.js'
import { outputSchema } from './user.schema.js'

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
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const _self = query.select().from(s.user).where(eq(s.user.authUserId, id))

    const [[self], activeActorTypes] = await Promise.all([
      _self,
      listActiveTypesForUser({ userId: id }),
    ])

    if (!self) {
      return null
    }

    return {
      ...self,
      _metadata: self._metadata as any,
      activeActorTypes,
    }
  },
)

export const canUserAccessLocation = withZod(
  z.object({
    userId: uuidSchema,
    locationId: uuidSchema,
  }),
  z.boolean(),
  async ({ userId, locationId }) => {
    const query = useQuery()

    const rows = await query
      .select({ number: sql<number>`1` })
      .from(s.actor)
      .innerJoin(
        s.person,
        and(eq(s.actor.personId, s.person.id), eq(s.person.userId, userId)),
      )
      .where(
        and(
          eq(s.actor.personId, userId),
          eq(s.actor.locationId, locationId),
          isNotNull(s.actor.deletedAt),
          inArray(s.actor.type, ['instructor', 'location_admin']),
        ),
      )

    return rows.length > 0
  },
)
