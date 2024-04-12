import { createDocument } from 'zod-openapi'
import { openApiObject } from '../index.js'

import { writeFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { fileURLToPath } from 'url'

function getProjectRoot() {
  const __filename = fileURLToPath(import.meta.url)

  const dirname = path.dirname(__filename)

  return path.resolve(dirname, '../../../../..')
}

const spec = createDocument(openApiObject)
const content = yaml.dump(spec, { indent: 2 })

writeFileSync(
  path.join(getProjectRoot(), 'specifications/api-gen.yaml'),
  content,
)
