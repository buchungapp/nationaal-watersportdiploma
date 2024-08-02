import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const GEAR_TYPE_LASER_PICO_ID = 'e0793bce-6d6f-424a-b9ca-1f391fc8ca30'

export async function addGearTypes() {
  const query = useQuery()

  await query.insert(s.gearType).values({
    id: GEAR_TYPE_LASER_PICO_ID,
    handle: 'laser-pico',
    title: 'Laser Pico',
  })
}
