#!/usr/bin/env node

const cp = require("node:child_process");

const options = { shell: true, stdio: "inherit" };

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
      PGURI: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    },
  });
  console.log("Seed script completed successfully");
} catch (error) {
  console.error("An error occurred:", error.message);
  console.error("Error details:", error);
  process.exit(1);
}
