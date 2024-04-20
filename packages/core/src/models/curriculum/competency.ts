import { schema as s } from '@nawadi/db'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../util/zod.js'

export * as Competency from './competency.js'

export const create = withZod(
  z.object({
    curriculumId: uuidSchema,
    moduleId: uuidSchema,
    competencyId: uuidSchema,
    isRequired: z.boolean(),
    requirement: z.string().trim().optional(),
  }),
  async (input) => {
    const query = useQuery()

    const [insert] = await query
      .insert(s.curriculumCompetency)
      .values({
        competencyId: input.competencyId,
        curriculumId: input.curriculumId,
        moduleId: input.moduleId,
        isRequired: input.isRequired,
        requirement: input.requirement,
      })
      .returning({ id: s.curriculumCompetency.id })

    if (!insert) {
      throw new Error('Failed to insert curriculumCompetency')
    }

    return insert
  },
)

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  return await query.select().from(s.curriculumCompetency)
})
