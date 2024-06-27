import { schema as s } from '@nawadi/db'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../utils/index.js'

export const byAllocationId = withZod(
  z.object({
    id: uuidSchema,
  }),
  async ({ id }) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.studentCohortProgress)
      .where(
        and(
          eq(s.studentCohortProgress.cohortAllocationId, id),
          isNull(s.studentCohortProgress.deletedAt),
        ),
      )

    return rows.map((row) => ({
      competencyId: row.competencyId,
      progress: row.progress,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  },
)
