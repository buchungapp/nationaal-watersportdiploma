import { schema as s } from '@nawadi/db'
import { SQL, and, asc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { exists } from 'drizzle-orm/mysql-core/expressions'
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
  insertSchema
    .pick({
      label: true,
      handle: true,
      locationId: true,
      accessStartTime: true,
      accessEndTime: true,
    })
    .refine((data) => {
      return data.accessStartTime < data.accessEndTime
    }, 'accessStartTime should be before accessEndTime'),
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
    personId: uuidSchema.optional(),
  }),
  selectSchema.array(),
  async (input) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.cohort)
      .where(
        and(
          eq(s.cohort.locationId, input.id),
          isNull(s.cohort.deletedAt),
          input.personId
            ? and(
                exists(
                  query
                    .select({ id: sql`1` })
                    .from(s.cohortAllocation)
                    .innerJoin(
                      s.actor,
                      and(
                        eq(s.actor.id, s.cohortAllocation.actorId),
                        isNull(s.actor.deletedAt),
                      ),
                    )
                    .innerJoin(
                      s.person,
                      and(
                        eq(s.person.id, s.actor.personId),
                        eq(s.person.id, input.personId),
                        isNull(s.person.deletedAt),
                      ),
                    )
                    .where(
                      and(
                        eq(s.cohort.id, s.cohortAllocation.cohortId),
                        isNull(s.cohortAllocation.deletedAt),
                      ),
                    ),
                ),
                lte(s.cohort.accessStartTime, sql`NOW()`),
                gte(s.cohort.accessEndTime, sql`NOW()`),
              )
            : undefined,
        ),
      )
      .orderBy(asc(s.cohort.accessStartTime), asc(s.cohort.accessEndTime))

    return rows
  },
)

export const byIdOrHandle = withZod(
  z.union([
    z.object({ id: uuidSchema }),
    z.object({ handle: handleSchema, locationId: uuidSchema }),
  ]),
  selectSchema.nullable(),
  async (input) => {
    const query = useQuery()

    const whereClausules: (SQL | undefined)[] = []

    if ('id' in input) {
      whereClausules.push(eq(s.cohort.id, input.id))
    }

    if ('handle' in input) {
      whereClausules.push(eq(s.cohort.handle, input.handle))
      whereClausules.push(eq(s.cohort.locationId, input.locationId))
    }

    const rows = await query
      .select()
      .from(s.cohort)
      .where(and(...whereClausules))

    const row = possibleSingleRow(rows)

    return row ?? null
  },
)

export const listDistinctTags = withZod(
  z.object({
    cohortId: uuidSchema,
  }),
  z.array(z.string()),
  async (input) => {
    const query = useQuery()

    const tagsSubquery = query
      .select({
        tag: sql<string>`UNNEST(${s.cohortAllocation.tags})`.as('tag'),
      })
      .from(s.cohortAllocation)
      .where(
        and(
          eq(s.cohortAllocation.cohortId, input.cohortId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .as('tags')

    const rows = await query
      .selectDistinct({
        tag: tagsSubquery.tag,
      })
      .from(tagsSubquery)
      .orderBy(asc(tagsSubquery.tag))

    return rows.map((row) => row.tag)
  },
)

export const getDefaultVisibleFromDate = withZod(
  z.object({
    cohortId: uuidSchema,
  }),
  z.string().datetime().nullable(),
  async (input) => {
    const query = useQuery()

    const row = await query
      .select({
        visibleFromDate: s.cohort.certificatesVisibleFrom,
      })
      .from(s.cohort)
      .where(and(eq(s.cohort.id, input.cohortId), isNull(s.cohort.deletedAt)))
      .then(singleRow)

    return row.visibleFromDate
  },
)

export const setDefaultVisibleFromDate = withZod(
  z.object({
    cohortId: uuidSchema,
    visibleFromDate: z.string().datetime(),
  }),
  z.object({
    visibleFromDate: z.string().datetime(),
  }),
  async (input) => {
    const query = useQuery()

    const result = await query
      .update(s.cohort)
      .set({
        certificatesVisibleFrom: input.visibleFromDate,
      })
      .where(and(eq(s.cohort.id, input.cohortId), isNull(s.cohort.deletedAt)))
      .returning({
        visibleFromDate: s.cohort.certificatesVisibleFrom,
      })
      .then(singleRow)

    return result as { visibleFromDate: string }
  },
)
