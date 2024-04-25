import { schema as s } from '@nawadi/db'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema, selectSchema } from './actor.schema.js'

export const listActiveTypesForUser = withZod(
  z.object({ userId: uuidSchema }),
  selectSchema.shape.type.array(),
  async () => {
    const query = useQuery()

    const rows = await query
      .select({ type: s.actor.type })
      .from(s.actor)
      .innerJoin(s.person, eq(s.actor.personId, s.person.id))
      .innerJoin(s.user, eq(s.person.userId, s.user.authUserId))
      .innerJoin(s.location, eq(s.actor.locationId, s.location.id))
      .innerJoin(
        s.personLocationLink,
        and(
          eq(s.personLocationLink.personId, s.person.id),
          eq(s.personLocationLink.locationId, s.location.id),
          eq(s.personLocationLink.status, 'linked'),
        ),
      )
      .where(isNull(s.actor.deletedAt))

    return rows.map(({ type }) => type)
  },
)

export const upsert = withZod(
  insertSchema.pick({ locationId: true, type: true, personId: true }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const [actor] = await query
      .insert(s.actor)
      .values(input)
      .onConflictDoNothing({
        target: [s.actor.type, s.actor.personId, s.actor.locationId],
      })
      .returning({ id: s.actor.id })

    if (!actor) {
      const [existing] = await query
        .select({ id: s.actor.id })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.type, input.type),
            input.personId ? eq(s.actor.personId, input.personId) : undefined,
            eq(s.actor.locationId, input.locationId),
          ),
        )

      if (!existing) {
        throw new Error('Failed to create actor')
      }

      return {
        id: existing.id,
      }
    }

    return actor
  },
)
