import { schema } from '@nawadi/db'
import { useQuery } from '../contexts/index.js'

export async function listPrograms() {
  const query = useQuery()

  const rows = await query
    .select({
      id: schema.program.id,
      title: schema.program.title,
      handle: schema.program.handle,
    })
    .from(schema.program)

  // programsRows could be used directly when the generator properly supports nulls.
  const result = rows.map((row) => ({
    id: row.id,
    title: row.title ?? '', // TODO this need support from the generator
    handle: row.handle,
  }))

  return result
}
