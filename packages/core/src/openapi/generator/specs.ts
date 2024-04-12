import { writeFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { createDocument } from 'zod-openapi'
import { projectRoot } from '../../root.js'
import { openApiObject } from '../index.js'

const spec = createDocument(openApiObject)
const content = yaml.dump(spec, { indent: 2 })

writeFileSync(path.join(projectRoot, 'specifications/api-gen.yaml'), content)
