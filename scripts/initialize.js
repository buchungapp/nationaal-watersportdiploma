#!/usr/bin/env node

const cp = require("node:child_process");
const path = require("node:path");

const options = { shell: true, stdio: "inherit" };

cp.execFileSync(
  "pnpm",
  [
    "--package",
    "@skiffa/generator@0.11.1",
    "dlx",
    "skiffa-generator",
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

cp.execFileSync(
  "pnpm",
  [
    "--package",
    "@redocly/cli@1.11.0",
    "dlx",
    "redocly",
    "build-docs",
    path.resolve("specifications", "api.yaml"),
    "--output",
    path.resolve("generated", "api-docs", "index.html"),
  ],
  options,
);
