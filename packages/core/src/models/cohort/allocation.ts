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
import { inArray } from 'drizzle-orm/sql/expressions'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  applyArrayOrEqual,
  possibleSingleRow,
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
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          isNull(s.actor.deletedAt),
        ),
      )
      .innerJoin(
        s.person,
        and(eq(s.person.id, s.actor.personId), isNull(s.person.deletedAt)),
      )
      .where(and(...whereClausules))

    return {
      rows,
      count: rows.length,
    }
  },
)

export const isPersonInCohortById = withZod(
  z.object({
    cohortId: uuidSchema,
    personId: uuidSchema,
    actorType: singleOrArray(
      z.enum(['student', 'instructor', 'location_admin']),
    ).optional(),
  }),
  async (input) => {
    const query = useQuery()

    const exists = await query
      .select({ id: sql`1` })
      .from(s.cohortAllocation)
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          isNull(s.actor.deletedAt),
          input.actorType
            ? Array.isArray(input.actorType)
              ? inArray(s.actor.type, input.actorType)
              : eq(s.actor.type, input.actorType)
            : undefined,
        ),
      )
      .innerJoin(
        s.person,
        and(
          eq(s.person.id, s.actor.personId),
          isNull(s.person.deletedAt),
          eq(s.person.id, input.personId),
        ),
      )
      .where(
        and(
          eq(s.cohortAllocation.cohortId, input.cohortId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .limit(1)
      .then(possibleSingleRow)

    return !!exists
  },
)

export const isActorInCohortById = withZod(
  z.object({
    cohortId: uuidSchema,
    actorId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const exists = await query
      .select({ id: sql`1` })
      .from(s.cohortAllocation)
      .where(
        and(
          eq(s.cohortAllocation.cohortId, input.cohortId),
          eq(s.cohortAllocation.actorId, input.actorId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .then(possibleSingleRow)

    return !!exists
  },
)

export const setInstructorForStudent = withZod(
  z.object({
    instructorId: uuidSchema,
    cohortId: uuidSchema,
    studentAllocationId: singleOrArray(uuidSchema),
  }),
  async (input) => {
    const query = useQuery()

    // Make sure the instructorId belong to an actor with type instructor and is in the cohort
    await query
      .select({ id: sql`1` })
      .from(s.cohortAllocation)
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          isNull(s.actor.deletedAt),
          eq(s.actor.type, 'instructor'),
          eq(s.actor.id, input.instructorId),
        ),
      )
      .where(
        and(
          eq(s.cohortAllocation.actorId, input.instructorId),
          eq(s.cohortAllocation.cohortId, input.cohortId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .then(singleRow)

    return await query
      .update(s.cohortAllocation)
      .set({ instructorId: input.instructorId })
      .where(
        and(
          Array.isArray(input.studentAllocationId)
            ? inArray(s.cohortAllocation.id, input.studentAllocationId)
            : eq(s.cohortAllocation.id, input.studentAllocationId),
          eq(s.cohortAllocation.cohortId, input.cohortId),
        ),
      )
      .returning({ id: s.cohortAllocation.id })
  },
)

export const setStudentCurriculum = withZod(
  z.object({
    studentCurriculumId: uuidSchema,
    cohortId: uuidSchema,
    studentAllocationId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.cohortAllocation)
      .set({ studentCurriculumId: input.studentCurriculumId })
      .where(
        and(
          eq(s.cohortAllocation.id, input.studentAllocationId),
          eq(s.cohortAllocation.cohortId, input.cohortId),
          exists(
            query
              .select({ id: sql`1` })
              .from(s.actor)
              .where(
                and(
                  eq(s.actor.id, s.cohortAllocation.actorId),
                  isNull(s.actor.deletedAt),
                  eq(s.actor.type, 'student'),
                ),
              ),
          ),
        ),
      )
      .returning({ id: s.cohortAllocation.id })
  },
)
