import { schema as s } from '@nawadi/db'
import { and, eq, inArray, isNull, max, notExists, sql } from 'drizzle-orm'
import { getTableColumns } from 'drizzle-orm/utils'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  enforceArray,
  singleOrArray,
  uuidSchema,
  withZod,
} from '../../utils/index.js'

export const byAllocationId = withZod(
  z.object({
    id: uuidSchema,
  }),
  async ({ id: cohortAllocationId }) => {
    const query = useQuery()

    const subquery = query
      .select({
        cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
        competencyId: s.studentCohortProgress.competencyId,
        maxCreatedAt: max(s.studentCohortProgress.createdAt).as(
          'max_created_at',
        ),
      })
      .from(s.studentCohortProgress)
      .where(eq(s.studentCohortProgress.cohortAllocationId, cohortAllocationId))
      .groupBy(
        s.studentCohortProgress.cohortAllocationId,
        s.studentCohortProgress.competencyId,
      )
      .as('latest')

    const rows = await query
      .select(getTableColumns(s.studentCohortProgress))
      .from(s.studentCohortProgress)
      .innerJoin(
        subquery,
        and(
          eq(
            s.studentCohortProgress.cohortAllocationId,
            subquery.cohortAllocationId,
          ),
          eq(s.studentCohortProgress.competencyId, subquery.competencyId),
          eq(s.studentCohortProgress.createdAt, subquery.maxCreatedAt),
        ),
      )
      .where(
        and(eq(s.studentCohortProgress.cohortAllocationId, cohortAllocationId)),
      )

    return rows.map((row) => ({
      competencyId: row.competencyId,
      progress: row.progress,
      createdAt: row.createdAt,
    }))
  },
)

export const upsertProgress = withZod(
  z.object({
    cohortAllocationId: uuidSchema,
    competencyProgress: singleOrArray(
      z.object({
        competencyId: uuidSchema,
        progress: z.number().int().min(0).max(100),
      }),
    ),
    createdBy: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    // TODO: We should check whether the competency belongs to the student curriculum

    const progressArray = enforceArray(input.competencyProgress)

    const result = await query
      .insert(s.studentCohortProgress)
      .values(
        progressArray.map(({ competencyId, progress }) => ({
          cohortAllocationId: input.cohortAllocationId,
          competencyId,
          progress: String(progress),
          createdBy: input.createdBy,
        })),
      )
      .returning({
        cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
        competencyId: s.studentCohortProgress.competencyId,
      })

    return result
  },
)

export const completeAllCoreCompetencies = withZod(
  z.object({
    cohortAllocationId: singleOrArray(uuidSchema),
    createdBy: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const uncompletedCoreCompetencies = await query
      .select({
        cohortAllocationId: s.cohortAllocation.id,
        competencyId: s.curriculumCompetency.id,
      })
      .from(s.cohortAllocation)
      .innerJoin(
        s.studentCurriculum,
        eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
      )
      .innerJoin(
        s.curriculumCompetency,
        eq(
          s.studentCurriculum.curriculumId,
          s.curriculumCompetency.curriculumId,
        ),
      )
      .where(
        and(
          Array.isArray(input.cohortAllocationId)
            ? inArray(s.cohortAllocation.id, input.cohortAllocationId)
            : eq(s.cohortAllocation.id, input.cohortAllocationId),
          eq(s.curriculumCompetency.isRequired, true),
          notExists(
            query
              .select({ id: sql`1` })
              .from(s.studentCohortProgress)
              .where(
                and(
                  eq(
                    s.studentCohortProgress.cohortAllocationId,
                    s.cohortAllocation.id,
                  ),
                  eq(
                    s.studentCohortProgress.competencyId,
                    s.curriculumCompetency.competencyId,
                  ),
                ),
              ),
          ),
          notExists(
            query
              .select({ id: sql`1` })
              .from(s.studentCompletedCompetency)
              .where(
                and(
                  eq(
                    s.studentCompletedCompetency.competencyId,
                    s.curriculumCompetency.competencyId,
                  ),
                  isNull(s.studentCompletedCompetency.deletedAt),
                ),
              ),
          ),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )

    const result = await query
      .insert(s.studentCohortProgress)
      .values(
        uncompletedCoreCompetencies.map(
          ({ competencyId, cohortAllocationId }) => ({
            cohortAllocationId,
            competencyId,
            progress: '100',
            createdBy: input.createdBy,
          }),
        ),
      )
      .returning({
        cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
        competencyId: s.studentCohortProgress.competencyId,
      })

    return result
  },
)
