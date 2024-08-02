import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const DISCIPLINE_ZWAARDBOOT_1_MANS_ID =
  '969cc8bc-cc32-42a0-b026-cf8d721cef1c'

export async function addDisciplines() {
  const query = useQuery()

  await query.insert(s.discipline).values({
    id: DISCIPLINE_ZWAARDBOOT_1_MANS_ID,
    handle: 'zwaardboot-1-mans',
    title: 'Zwaardboot 1-mans',
    weight: 1,
  })
}
