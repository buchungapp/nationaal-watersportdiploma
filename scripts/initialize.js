#!/usr/bin/env node

const cp = require("child_process");
const path = require("path");

const options = { shell: true, stdio: "inherit" };

cp.execFileSync(
  "pnpm",
  [
    "--package",
    "oa42-generator@0.9.6",
    "dlx",
    "oa42-generator",
    "package",
    path.resolve("specifications", "api.yaml"),
    "--package-directory",
    path.resolve("generated", "api"),
    "--package-name",
    "@nawadi/api",
    "--package-version",
    "0.0.0",
  ],
  options,
);

cp.execFileSync("pnpm", ["--filter", "@nawadi/api", "install"], options);
cp.execFileSync("pnpm", ["--filter", "@nawadi/api", "build"], options);