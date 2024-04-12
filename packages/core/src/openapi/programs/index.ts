import { ZodOpenApiPathsObject } from 'zod-openapi'
import { getPrograms } from './get-programs.js'

export const programPaths: ZodOpenApiPathsObject = {
  '/programs': {
    get: getPrograms,
  },
}
