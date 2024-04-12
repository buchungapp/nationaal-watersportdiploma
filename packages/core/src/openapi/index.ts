import { ZodOpenApiObject } from 'zod-openapi'
import { ProgramSchema } from '../schemas/program.js'
import { programPaths } from './programs/index.js'

export const openApiObject: ZodOpenApiObject = {
  openapi: '3.0.2',
  info: {
    title: 'Nationaal Watersportdiploma API',
    description: '',
    version: '0.1.0',
    contact: {
      name: 'Nationaal Watersportdiploma Secretariaat',
      email: 'info@nationaalwatersportdiploma.nl',
      url: 'https://www.nationaalwatersportdiploma.nl/api',
    },
    license: {
      name: 'AGPL-3.0 license',
      url: 'https://github.com/buchungapp/nationaal-watersportdiploma/blob/main/LICENSE',
    },
  },
  servers: [
    {
      url: 'https://api.nwd.nl',
      description: 'Production API',
    },
  ],
  paths: {
    ...programPaths,
  },
  components: {
    schemas: {
      ProgramSchema,
    },
    securitySchemes: {
      token: {
        type: 'http',
        description: 'Default authentication mechanism',
        scheme: 'bearer',
        in: 'header',
      },
    },
    responses: {
      forbidden: {
        description: 'Forbidden',
      },
    },
  },
}
