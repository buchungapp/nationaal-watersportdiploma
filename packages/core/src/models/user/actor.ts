import { schema as s } from '@nawadi/db'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../utils/index.js'
import { selectSchema } from './actor.schema.js'

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
          eq(s.personLocationLink.status, 'accepted'),
        ),
      )
      .where(isNull(s.actor.deletedAt))

    return rows.map(({ type }) => type)
  },
)
