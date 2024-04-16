import { schema } from '@nawadi/db'
import { useQuery } from '../contexts/index.js'
import { normalizeHandle, normalizeTitle } from './normalize.js'
import { singleRow } from './row.js'

export async function listPrograms() {
  const query = useQuery()

  const rows = await query
    .select({
      id: schema.program.id,
      title: schema.program.title,
      handle: schema.program.handle,
    })
    .from(schema.program)

  return rows
}

export async function createProgram(item: {
  title: string
  handle: string
  disciplineId: string
  degreeId: string
}) {
  const query = useQuery()

  const rows = await query
    .insert(schema.program)
    .values({
      title: normalizeTitle(item.title),
      handle: normalizeHandle(item.handle),
      disciplineId: item.disciplineId,
      degreeId: item.degreeId,
    })
    .returning({ id: schema.program.id })

  const row = singleRow(rows)
  return row
}
