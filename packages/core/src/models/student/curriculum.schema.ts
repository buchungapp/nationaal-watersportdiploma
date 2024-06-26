import { schema as s } from '@nawadi/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { outputSchema as courseSelectSchema } from '../course/course.schema.js'
import { outputSchema as programSelectSchema } from '../course/program.schema.js'
import { outputSchema as curriculumSelectSchema } from '../curriculum/curriculum.schema.js'
import { selectSchema as gearTypeSelectSchema } from '../curriculum/gear-type.schema.js'

export const insertSchema = createInsertSchema(s.studentCurriculum, {
  personId: (schema) => schema.personId.uuid(),
  curriculumId: (schema) => schema.curriculumId.uuid(),
  gearTypeId: (schema) => schema.gearTypeId.uuid(),
  startedAt: (schema) => schema.startedAt.datetime(),
})

export type Input = z.input<typeof insertSchema>

export const selectSchema = createSelectSchema(s.studentCurriculum)

export const outputSchema = selectSchema
  .omit({ curriculumId: true, gearTypeId: true })
  .extend({
    curriculum: curriculumSelectSchema.pick({ id: true }).extend({
      program: programSelectSchema
        .pick({ id: true, handle: true, title: true })
        .extend({
          course: courseSelectSchema.pick({
            id: true,
            handle: true,
            title: true,
          }),
        }),
    }),
    gearType: gearTypeSelectSchema.pick({
      id: true,
      handle: true,
      title: true,
    }),
  })

export type Output = z.output<typeof outputSchema>
