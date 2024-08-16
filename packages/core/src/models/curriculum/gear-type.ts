import { schema as s } from '@nawadi/db'
import { SQLWrapper, and, asc, eq, exists, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { isEditable } from './curriculum.js'
import { insertSchema, selectSchema } from './gear-type.schema.js'

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const rows = await tx
        .insert(s.gearType)
        .values({
          title: item.title,
          handle: item.handle,
        })
        .returning({ id: s.gearType.id })

      const row = singleRow(rows)
      return row
    }),
)

export const update = withZod(
  insertSchema
    .pick({
      id: true,
      title: true,
      handle: true,
    })
    .required({ id: true }),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const row = await query
      .update(s.gearType)
      .set({
        title: item.title,
        handle: item.handle,
      })
      .where(eq(s.gearType.id, item.id))
      .returning({ id: s.gearType.id })
      .then(singleRow)

    return row
  },
)

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          id: singleOrArray(uuidSchema).optional(),
          handle: singleOrArray(handleSchema).optional(),
          curriculumId: singleOrArray(uuidSchema).optional(),
        })
        .default({}),
    })
    .default({}),
  selectSchema.array(),
  async ({ filter }) => {
    const query = useQuery()
    const filters: SQLWrapper[] = []

    const gearTypeQuery = query.select().from(s.gearType)

    if (filter.curriculumId) {
      filters.push(
        exists(
          query
            .select()
            .from(s.curriculumGearLink)
            .where(
              and(
                eq(s.curriculumGearLink.gearTypeId, s.gearType.id),
                Array.isArray(filter.curriculumId)
                  ? inArray(
                      s.curriculumGearLink.curriculumId,
                      filter.curriculumId,
                    )
                  : eq(s.curriculumGearLink.curriculumId, filter.curriculumId),
              ),
            ),
        ),
      )
    }

    if (filter.id) {
      filters.push(
        Array.isArray(filter.id)
          ? inArray(s.gearType.id, filter.id)
          : eq(s.gearType.id, filter.id),
      )
    }

    if (filter.handle) {
      filters.push(
        Array.isArray(filter.handle)
          ? inArray(s.gearType.handle, filter.handle)
          : eq(s.gearType.handle, filter.handle),
      )
    }

    const rows = await gearTypeQuery
      .where(and(...filters))
      .orderBy(asc(s.gearType.title))

    return rows
  },
)

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.gearType)
      .where(eq(s.gearType.handle, handle))

    return possibleSingleRow(rows) ?? null
  },
)

export const fromId = withZod(
  uuidSchema,
  selectSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.gearType)
      .where(eq(s.gearType.id, id))

    return possibleSingleRow(rows) ?? null
  },
)

export const linkToCurriculum = withZod(
  z.object({
    gearTypeId: z.string(),
    curriculumId: z.string(),
  }),
  z.void(),
  async (input) => {
    const query = useQuery()

    if (!(await isEditable({ curriculumId: input.curriculumId }))) {
      throw new Error('Curriculum is not editable')
    }

    await query
      .insert(s.curriculumGearLink)
      .values({
        gearTypeId: input.gearTypeId,
        curriculumId: input.curriculumId,
      })
      .onConflictDoNothing({
        target: [
          s.curriculumGearLink.gearTypeId,
          s.curriculumGearLink.curriculumId,
        ],
      })
  },
)

export const unlinkFromCurriculum = withZod(
  z.object({
    gearTypeId: z.string(),
    curriculumId: z.string(),
  }),
  z.void(),
  async (input) => {
    const query = useQuery()

    if (!(await isEditable({ curriculumId: input.curriculumId }))) {
      throw new Error('Curriculum is not editable')
    }

    await query
      .delete(s.curriculumGearLink)
      .where(
        and(
          eq(s.curriculumGearLink.gearTypeId, input.gearTypeId),
          eq(s.curriculumGearLink.curriculumId, input.curriculumId),
        ),
      )
  },
)
