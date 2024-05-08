import { schema as s } from '@nawadi/db'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { withZod } from '../../utils/index.js'

export const list = withZod(z.void(), async () => {
  const query = useQuery()
  return await query
    .select({
      nl: s.country.nl,
      alpha2: s.country.alpha_2,
    })
    .from(s.country)
    .orderBy(asc(s.country.nl))
    .then((rows) =>
      rows.map((row) => ({
        name: row.nl,
        code: row.alpha2,
      })),
    )
})
