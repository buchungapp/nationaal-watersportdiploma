#!/usr/bin/env node

const cp = require("node:child_process");

const options = { shell: true, stdio: "inherit" };

cp.execFileSync("pnpm", ["--filter", "supabase", "reset"], options);
cp.execFileSync(
  "pnpm",
  [
    "--filter",
    "db",
    "execute-migration",
    "--pg-uri",
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  ],
  options,
);
