import "server-only";

import { initializeProcessScopedDatabase } from "@nawadi/core";

export function withContexts(): void {
  const cleanupDatabase = initializeProcessScopedDatabase({
    max: 35,
    connectionString: process.env.PGURI,
  });

  for (const signal of ["beforeExit", "SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await cleanupDatabase();

      if (signal !== "beforeExit") {
        process.exit();
      }
    });
  }

  return;
}
