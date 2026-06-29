#!/usr/bin/env node

const cp = require("node:child_process");
const path = require("node:path");

const options = { shell: true, stdio: "inherit" };
const pnpmCommand = process.env.npm_config_user_agent?.startsWith("pnpm/")
  ? "corepack"
  : "pnpm";

function runPnpm(args) {
  cp.execFileSync(
    pnpmCommand,
    pnpmCommand === "corepack" ? ["pnpm", ...args] : args,
    options,
  );
}

runPnpm([
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
]);

runPnpm(["--filter", "@nawadi/api", "install"]);
runPnpm(["--filter", "@nawadi/api", "build"]);

runPnpm([
  "--package",
  "@redocly/cli@1.11.0",
  "dlx",
  "redocly",
  "build-docs",
  path.resolve("specifications", "api.yaml"),
  "--output",
  path.resolve("generated", "api-docs", "index.html"),
]);
