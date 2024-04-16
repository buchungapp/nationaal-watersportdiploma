import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { useQuery } from '../contexts/index.js'
import { normalizeHandle, normalizeTitle, singleRow } from '../util/index.js'

export async function list() {
  const query = useQuery()

  const rows = await query
    .select({
      id: schema.program.id,
      title: schema.program.title,
      handle: schema.program.handle,

      disciplineId: schema.discipline.id,
      disciplineTitle: schema.discipline.title,

      degreeId: schema.degree.id,
      degreeTitle: schema.degree.title,
    })
    .from(schema.program)
    .innerJoin(
      schema.discipline,
      eq(schema.program.disciplineId, schema.discipline.id),
    )
    .innerJoin(schema.degree, eq(schema.program.degreeId, schema.degree.id))

  return rows
}

export async function create(item: {
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
