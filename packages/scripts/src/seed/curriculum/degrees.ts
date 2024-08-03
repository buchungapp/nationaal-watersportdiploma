import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const DEGREE_LEVEL_1_ID = '99ac70ba-18d4-4f94-bde7-b37388a1bbcb'
export const DEGREE_LEVEL_2_ID = 'e8e3c1e3-7e3e-4b0b-8b5f-7f4a9e8d5c8b'
export const DEGREE_LEVEL_3_ID = 'f1f1f1f1-1f1f-1f1f-1f1f-1f1f1f1f1f1f'
export const DEGREE_LEVEL_4_ID = 'f2f2f2f2-2f2f-2f2f-2f2f-2f2f2f2f2f2f'

export async function addDegrees() {
  const query = useQuery()

  await query.insert(s.degree).values([
    {
      id: DEGREE_LEVEL_1_ID,
      handle: 'niveau-1',
      title: '1',
      rang: 1,
    },
    {
      id: DEGREE_LEVEL_2_ID,
      handle: 'niveau-2',
      title: '2',
      rang: 2,
    },
    {
      id: DEGREE_LEVEL_3_ID,
      handle: 'niveau-3',
      title: '3',
      rang: 3,
    },
    {
      id: DEGREE_LEVEL_4_ID,
      handle: 'niveau-4',
      title: '4',
      rang: 4,
    },
  ])
}
