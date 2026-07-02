#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const options = { shell: true, stdio: "inherit" };
const PGURI = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  console.log("Executing seed script...");
  execFileSync(
    "pnpm",
    ["--filter", "@nawadi/scripts", "exec", "tsx", "src/seed/seed.ts"],
    {
      ...options,
      env: {
        ...process.env,
        PGURI,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_SERVICE_ROLE_KEY:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
      },
    },
  );
  console.log("Seed script completed successfully");

  const kssSeed = resolve(__dirname, "..", "supabase", "kss-dev-seed.sql");
  if (existsSync(kssSeed)) {
    console.log("Applying KSS dev seed (supabase/kss-dev-seed.sql)...");
    execFileSync(
      "psql",
      [PGURI, "-v", "ON_ERROR_STOP=1", "-f", kssSeed],
      options,
    );
    console.log("KSS dev seed applied successfully");
  } else {
    console.log(
      "Skipping KSS dev seed: supabase/kss-dev-seed.sql not found (gitignored; ask a maintainer for the file).",
    );
  }
} catch (error) {
  console.error("An error occurred:", error.message);
  console.error("Error details:", error);
  process.exit(1);
}
