import * as api from '@nawadi/api'
import { schema } from '@nawadi/db'
import * as application from '../../application/index.js'

export function getPrograms({
  database,
}: application.Context): api.GetProgramsOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) =>
    // we don't need a transaction here, but this illustrates one way of
    // putting the entire operation in a transaction
    database.transaction(async (transaction) => {
      const programsRows = await transaction
        .select({
          id: schema.program.id,
          title: schema.program.title,
          handle: schema.program.handle,
        })
        .from(schema.program)

      // programsRows could be used directly when the generator properly supports nulls.
      const programsEntity = programsRows.map((row) => ({
        id: row.id,
        title: row.title ?? '', // TODO this need support from the generator
        handle: row.handle,
      }))

      return {
        status: 200,
        parameters: {},
        contentType: 'application/json',
        entity: () => programsEntity,
      }
    })
}
