import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../utils/index.js'
import { listActiveTypesForUser } from './actor.js'
import { outputSchema } from './user.schema.js'

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
