import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const MODULE_THEORIE_EXTRA_ID = '51a679c8-76f2-497b-8a2f-a4e3b35c9fda'
export const MODULE_THEORIE_ID = '51a679c8-76f2-497b-8a2f-a4e3b35c9fdb'
export const MODULE_HANDELING_ID = '51a679c8-76f2-497b-8a2f-a4e3b35c9fdc'
export const MODULE_BASIS_ID = '51a679c8-76f2-497b-8a2f-a4e3b35c9fdd'

export async function addModules() {
  const query = useQuery()

  await query.insert(s.module).values([
    {
      id: MODULE_THEORIE_EXTRA_ID,
      handle: 'theorie-extra',
      title: 'Theorie extra',
      weight: 910,
    },
    {
      id: MODULE_THEORIE_ID,
      handle: 'theorie',
      title: 'Theorie',
      weight: 900,
    },
    {
      id: MODULE_HANDELING_ID,
      handle: 'handeling',
      title: 'Handeling',
      weight: 200,
    },
    {
      id: MODULE_BASIS_ID,
      handle: 'basis',
      title: 'Basis',
      weight: 100,
    },
  ])
}
