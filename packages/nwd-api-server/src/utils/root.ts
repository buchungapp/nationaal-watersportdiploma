import * as path from "path";

export const projectRoot = makeProjectRoot();

function makeProjectRoot() {
  const dirname = __dirname;
  return path.resolve(dirname, "..", "..");
}
