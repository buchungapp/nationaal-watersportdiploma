import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  const dirname = __dirname;
  return path.resolve(dirname, "..");
}
