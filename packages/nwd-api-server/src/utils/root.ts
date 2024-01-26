import * as path from "path";
import { fileURLToPath } from "url";

export const projectRoot = makeProjectRoot();

function makeProjectRoot() {
  const dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
  return path.resolve(dirname, "..", "..");
}
