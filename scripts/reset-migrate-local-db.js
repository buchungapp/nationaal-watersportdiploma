#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const options = { shell: true, stdio: "inherit" };

execFileSync("pnpm", ["--filter", "supabase", "reset"], options);
execFileSync(
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
