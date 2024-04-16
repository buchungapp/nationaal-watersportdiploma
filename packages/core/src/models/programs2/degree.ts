import { schema } from '@nawadi/db'
import { useQuery } from '../../contexts/index.js'
import {
  normalizeHandle,
  normalizeRang,
  normalizeTitle,
  singleRow,
} from '../../util/index.js'

export async function listDegrees() {
  const query = useQuery()

  const rows = await query
    .select({
      id: schema.degree.id,
      title: schema.degree.title,
      handle: schema.degree.handle,
      rang: schema.degree.rang,
    })
    .from(schema.degree)

  return rows
}

export async function createDegree(item: {
  title: string
  handle: string
  rang: number
}) {
  const query = useQuery()

  const rows = await query
    .insert(schema.degree)
    .values({
      title: normalizeTitle(item.title),
      handle: normalizeHandle(item.handle),
      rang: normalizeRang(item.rang),
    })
    .returning({ id: schema.degree.id })

  const row = singleRow(rows)
  return row
}
