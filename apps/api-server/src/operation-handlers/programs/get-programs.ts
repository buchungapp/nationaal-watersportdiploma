import * as api from '@nawadi/api'
import { Program } from '@nawadi/core'
import * as application from '../../application/index.js'

export function getPrograms(
  context: application.Context,
): api.GetMainCategoriesOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const programs = await Program.list()

    return {
      status: 200,
      parameters: {},
      contentType: 'application/json',
      entity: () => [],
    }
  }
}
