#!/usr/bin/env node

const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const options = { shell: true, stdio: "inherit" };
const PGURI = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

try {
  console.log("Executing pnpm build...");
  cp.execFileSync(
    "pnpm",
    ["--filter", "core", "--filter", "scripts", "build"],
    options,
  );
  console.log("pnpm build completed successfully");

  console.log("Executing seed script...");
  cp.execFileSync("node", ["./packages/scripts/out/seed/seed"], {
    ...options,
    env: {
      ...process.env,
      PGURI,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    },
  });
  console.log("Seed script completed successfully");

  const kssSeed = path.resolve(__dirname, "..", "supabase", "kss-dev-seed.sql");
  if (fs.existsSync(kssSeed)) {
    console.log("Applying KSS dev seed (supabase/kss-dev-seed.sql)...");
    cp.execFileSync("psql", [PGURI, "-v", "ON_ERROR_STOP=1", "-f", kssSeed], options);
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
