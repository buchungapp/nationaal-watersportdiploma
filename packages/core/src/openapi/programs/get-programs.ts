import { ZodOpenApiOperationObject } from 'zod-openapi'
import { ProgramSchema } from '../../schemas/program'
import { openApiZ as z } from '../../util/zod'

export const getPrograms: ZodOpenApiOperationObject = {
  operationId: 'get-programs',
  summary: 'Retrieve a list of programs',
  description:
    'Retrieve a list of programs. The list will be paginated and the provided query parameters allow filtering the returned programs.',
  requestParams: {
    query: z.object({}),
  },
  responses: {
    '200': {
      description: 'A list of programs',
      content: {
        'application/json': {
          schema: z.array(ProgramSchema),
        },
      },
    },
  },
  tags: ['Programs'],
  security: [{ token: [] }],
}
