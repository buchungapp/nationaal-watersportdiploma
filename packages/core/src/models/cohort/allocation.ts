import { schema as s } from '@nawadi/db'
import { useQuery } from '../../contexts/index.js'
import {
  singleRow,
  successfulCreateResponse,
  withZod,
} from '../../utils/index.js'
import { insertSchema } from './allocation.schema.js'

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

// export const findMany = withZod(
//   z.object({
//     locationId: uuidSchema,
//   }),
//   outputSchema.array(),
//   async (input) => {
//     const query = useQuery()

//     const rows = await query
//       .select()
//       .from(s.cohort)
//       .where(eq(s.cohort.locationId, input.locationId))
//       .orderBy(asc(s.cohort.accessStartTime), asc(s.cohort.accessEndTime))

//     return rows
//   },
// )
