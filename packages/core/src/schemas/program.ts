import { Program } from '../models/program/index.js'
import { openApiZ as z } from '../util/zod.js'

export const ProgramSchema = z.object({
  id: Program.Info.shape.id.describe('The unique identifier of the program'),
  handle: Program.Info.shape.handle.describe(
    'The unique handle of the program',
  ),
  title: Program.Info.shape.title.describe('The title of the program'),
})
