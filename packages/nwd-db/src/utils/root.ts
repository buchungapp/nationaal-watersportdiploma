import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  const dirname = typeof __dirname === "undefined" ? eval("import.meta.dirname") : __dirname;
  return path.resolve(dirname, "..", "..");
}
