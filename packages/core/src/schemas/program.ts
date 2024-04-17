import { Curriculum } from '../models/curriculum/index.js'
import {
  Category,
  Competency,
  Degree,
  Discipline,
  Program,
} from '../models/program/index.js'
import { openApiZ as z } from '../util/zod.js'

const categorySchema = Category.Info.pick({
  id: true,
  handle: true,
  title: true,
  description: true,
})

export const ProgramSchema = z.object({
  id: Program.Info.shape.id.describe('The unique identifier of the program'),
  handle: Program.Info.shape.handle.describe(
    'The unique handle of the program',
  ),
  title: Program.Info.shape.title.describe('The title of the program'),
  curriculum: Curriculum.Info.pick({
    revision: true,
    startedAt: true,
  }).describe('The curriculum of the program'),
  discipline: Discipline.Info.pick({
    id: true,
    title: true,
    handle: true,
  }).describe('The discipline of the program'),
  degree: Degree.Info.pick({
    id: true,
    title: true,
    handle: true,
    rang: true,
  }).describe('The degree of the program'),
  categories: categorySchema
    .merge(
      z.object({
        parent: categorySchema
          .nullable()
          .describe('The parent category of the program'),
      }),
    )
    .array()
    .describe('The categories of the program'),
  modules: z
    .object({
      id: Program.Info.shape.id.describe('The unique identifier of the module'),
      handle: Program.Info.shape.handle.describe(
        'The unique handle of the module',
      ),
      title: Program.Info.shape.title.describe('The title of the module'),
      isRequired: Curriculum.Competency.Info.shape.isRequired.describe(
        'Whether the module is required',
      ),
      type: Competency.Info.shape.type.describe('The type of the module'),
      competencies: z
        .object({
          handle: Competency.Info.shape.handle.describe(
            'The unique handle of the competency',
          ),
          title: Competency.Info.shape.title.describe(
            'The title of the competency',
          ),
          type: Competency.Info.shape.type.describe(
            'The type of the competency',
          ),
          requirement: Curriculum.Competency.Info.shape.requirement.describe(
            'The requirement of the competency',
          ),
        })
        .array()
        .describe('The competencies of the module'),
    })
    .array()
    .describe('The modules of the program'),
})
