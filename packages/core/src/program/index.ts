import { schema } from '@nawadi/db'
import { createSelectSchema } from 'drizzle-zod'

export * as Program from './'
export { Competency } from './competency'
export { Degree } from './degree'
export { Discipline } from './discipline'
export { Module } from './module'

const program = schema.program

export const Info = createSelectSchema(program, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
})
export type Info = typeof program.$inferSelect
