import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = makeProjectRoot();

function makeProjectRoot() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(dirname, "..");
}
