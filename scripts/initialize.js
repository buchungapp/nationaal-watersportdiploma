#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, "..");

const options = { shell: true, stdio: "inherit", env: process.env };

execFileSync(
  "pnpm",
  [
    "--package",
    "@skiffa/generator@0.13.34",
    "dlx",
    "skiffa-generator",
    "package",
    path.resolve(workspaceRoot, "specifications", "api.yaml"),
    "--package-directory",
    path.resolve(workspaceRoot, "generated", "api"),
    "--package-name",
    "@nawadi/api",
    "--package-version",
    "0.0.0",
  ],
  options,
);

execFileSync("pnpm", ["--filter", "@nawadi/api", "install"], options);
execFileSync("pnpm", ["--filter", "@nawadi/api", "build"], options);
