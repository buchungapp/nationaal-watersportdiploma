import { schema as s } from '@nawadi/db'
import {
  SQL,
  and,
  arrayContains,
  eq,
  exists,
  getTableColumns,
  isNull,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  applyArrayOrEqual,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { selectSchema as actorSelectSchema } from '../user/actor.schema.js'
import { selectSchema as personSelectSchema } from '../user/person.schema.js'
import { insertSchema, selectSchema } from './allocation.schema.js'
export const create = withZod(
  insertSchema.pick({
    actorId: true,
    cohortId: true,
    studentCurriculumId: true,
    tags: true,
  }),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const row = await query
      .insert(s.cohortAllocation)
      .values({
        actorId: item.actorId,
        cohortId: item.cohortId,
        studentCurriculumId: item.studentCurriculumId,
        tags: item.tags,
      })
      .returning({ id: s.cohortAllocation.id })
      .then(singleRow)

    return row
  },
)

export const listAndCountForCohort = withZod(
  z.object({
    where: z.object({
      cohortId: uuidSchema,
      tags: z.string().array().optional(),
      gearTypeId: singleOrArray(uuidSchema).optional(),
    }),
  }),
  z.object({
    rows: selectSchema
      .pick({
        id: true,
        tags: true,
        createdAt: true,
        studentCurriculumId: true,
      })
      .extend({
        actor: z.object({
          id: selectSchema.shape.actorId,
          type: actorSelectSchema.shape.type,
        }),
        person: personSelectSchema.pick({
          id: true,
          firstName: true,
          lastNamePrefix: true,
          lastName: true,
        }),
      })
      .array(),
    count: z.number(),
  }),
  async (input) => {
    const query = useQuery()

    const whereClausules: (SQL | undefined)[] = [
      isNull(s.cohortAllocation.deletedAt),
      eq(s.cohortAllocation.cohortId, input.where.cohortId),
      input.where.tags
        ? arrayContains(s.cohortAllocation.tags, input.where.tags)
        : undefined,
      input.where.gearTypeId
        ? exists(
            query
              .select({ id: sql`1` })
              .from(s.studentCurriculum)
              .where(
                and(
                  eq(
                    s.studentCurriculum.id,
                    s.cohortAllocation.studentCurriculumId,
                  ),
                  applyArrayOrEqual(
                    s.studentCurriculum.gearTypeId,
                    input.where.gearTypeId,
                  ),
                ),
              ),
          )
        : undefined,
    ]

    const { id, tags, actorId, createdAt, studentCurriculumId } =
      getTableColumns(s.cohortAllocation)

    const rows = await query
      .select({
        id,
        tags,
        studentCurriculumId,
        actor: {
          id: actorId,
          type: s.actor.type,
        },
        person: {
          id: s.person.id,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
        },
        createdAt,
      })
      .from(s.cohortAllocation)
      .innerJoin(s.actor, eq(s.actor.id, s.cohortAllocation.actorId))
      .innerJoin(s.person, eq(s.person.id, s.actor.personId))
      .where(and(...whereClausules))

    return {
      rows,
      count: rows.length,
    }
  },
)
