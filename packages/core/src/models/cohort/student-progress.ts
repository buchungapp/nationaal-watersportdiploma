import { schema as s } from '@nawadi/db'
import { and, eq, sql } from 'drizzle-orm'
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

    const rankedSq = query
      .select({
        cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
        curriculumModuleCompetencyId: s.studentCohortProgress.competencyId,
        progress: s.studentCohortProgress.progress,
        rn: sql<number>`ROW_NUMBER() OVER (
  PARTITION BY ${s.studentCohortProgress.cohortAllocationId}, ${s.studentCohortProgress.competencyId}
  ORDER BY ${s.studentCohortProgress.createdAt} DESC
)`
          .mapWith(Number)
          .as('rn'),
      })
      .from(s.studentCohortProgress)
      .as('ranked')

    const latestProgress = query.$with('latest_progress').as(
      query
        .select({
          cohortAllocationId: rankedSq.cohortAllocationId,
          curriculumModuleCompetencyId: rankedSq.curriculumModuleCompetencyId,
          progress: rankedSq.progress,
        })
        .from(rankedSq)
        .where(eq(rankedSq.rn, 1)),
    )

    const rows = await query
      .with(latestProgress)
      .select(getTableColumns(s.studentCohortProgress))
      .from(s.studentCohortProgress)
      .innerJoin(
        latestProgress,
        and(
          eq(
            s.studentCohortProgress.cohortAllocationId,
            latestProgress.cohortAllocationId,
          ),
          eq(
            s.studentCohortProgress.competencyId,
            latestProgress.curriculumModuleCompetencyId,
          ),
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
