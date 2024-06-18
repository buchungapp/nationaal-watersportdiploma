import { schema as s } from '@nawadi/db'
import { useQuery } from '../../contexts/index.js'
import { successfulCreateResponse, withZod } from '../../utils/index.js'
import { insertSchema } from './curriculum.schema.js'

export const start = withZod(
  insertSchema.pick({
    personId: true,
    curriculumId: true,
    gearTypeId: true,
    startedAt: true,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const [insert] = await query
      .insert(s.studentCurriculum)
      .values({
        personId: input.personId,
        curriculumId: input.curriculumId,
        gearTypeId: input.gearTypeId,
        startedAt: input.startedAt,
      })
      .returning({ id: s.studentCurriculum.id })

    if (!insert) {
      throw new Error('Failed to start program')
    }

    return insert
  },
)
