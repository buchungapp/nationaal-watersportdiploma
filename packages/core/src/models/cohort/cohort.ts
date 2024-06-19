import { schema as s } from '@nawadi/db'
import { SQL, and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema, selectSchema } from './cohort.schema.js'

export const create = withZod(
  insertSchema.pick({
    label: true,
    handle: true,
    locationId: true,
    accessStartTime: true,
    accessEndTime: true,
  }),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const row = await query
      .insert(s.cohort)
      .values({
        label: item.label,
        handle: item.handle,
        locationId: item.locationId,
        accessStartTime: item.accessStartTime,
        accessEndTime: item.accessEndTime,
      })
      .returning({ id: s.cohort.id })
      .then(singleRow)

    return row
  },
)

export const listByLocationId = withZod(
  z.object({
    id: uuidSchema,
  }),
  selectSchema.array(),
  async (input) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.cohort)
      .where(eq(s.cohort.locationId, input.id))
      .orderBy(asc(s.cohort.accessStartTime), asc(s.cohort.accessEndTime))

    return rows
  },
)

export const findOne = withZod(
  z.object({
    id: uuidSchema.optional(),
    handle: handleSchema.optional(),
  }),
  selectSchema.nullable(),
  async (input) => {
    const query = useQuery()

    const whereClausules: (SQL | undefined)[] = []

    if (input.id) {
      whereClausules.push(eq(s.cohort.id, input.id))
    }

    if (input.handle) {
      whereClausules.push(eq(s.cohort.handle, input.handle))
    }

    const rows = await query
      .select()
      .from(s.cohort)
      .where(and(...whereClausules))

    const row = possibleSingleRow(rows)

    return row ?? null
  },
)
