import path from 'path'
import { fileURLToPath } from 'url'

export const projectRoot = getProjectRoot()

function getProjectRoot() {
  const __filename = fileURLToPath(import.meta.url)

  const dirname = path.dirname(__filename)

  return path.resolve(dirname, '..')
}
