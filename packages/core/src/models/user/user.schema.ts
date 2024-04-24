import { schema as s } from '@nawadi/db'
import { createSelectSchema } from 'drizzle-zod'
import { selectSchema as selectSchemaActor } from './actor.schema.js'

export const selectSchema = createSelectSchema(s.user)

export const outputSchema = selectSchema.extend({
  activeActorTypes: selectSchemaActor.shape.type.array(),
})
