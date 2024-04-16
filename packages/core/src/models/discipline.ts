import { schema } from '@nawadi/db'
import { useQuery } from '../contexts/index.js'
import { normalizeHandle, normalizeTitle, singleRow } from '../util/index.js'

export async function list() {
  const query = useQuery()

  const rows = await query
    .select({
      id: schema.discipline.id,
      title: schema.discipline.title,
      handle: schema.discipline.handle,
    })
    .from(schema.discipline)

  return rows
}

export async function create(item: { title: string; handle: string }) {
  const query = useQuery()

  const rows = await query
    .insert(schema.discipline)
    .values({
      title: normalizeTitle(item.title),
      handle: normalizeHandle(item.handle),
    })
    .returning({ id: schema.discipline.id })

  const row = singleRow(rows)
  return row
}
