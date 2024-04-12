import { ZodOpenApiPathsObject } from 'zod-openapi'
import { getPrograms } from './get-programs'

export const programPaths: ZodOpenApiPathsObject = {
  '/programs': {
    get: getPrograms,
  },
}
