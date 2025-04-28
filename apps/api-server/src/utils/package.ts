import * as fs from "node:fs";
import * as path from "node:path";
import type { PackageJson } from "type-fest";
import { projectRoot } from "../root.js";

export const packageInfo = readPackageInfo();

function readPackageInfo() {
  const content = fs.readFileSync(
    path.join(projectRoot, "package.json"),
    "utf8",
  );
  return JSON.parse(content) as PackageJson;
}
