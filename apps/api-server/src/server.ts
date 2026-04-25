import { serve } from "@hono/node-server";
import * as core from "@nawadi/core";
import { createApp } from "./app.js";

interface RunServerConfig {
  port: number;
  pgUri: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export async function runServer(config: RunServerConfig) {
  const logConfig = core.consoleLogConfiguration();

  await core.withLog(logConfig, async () => {
    try {
      core.info("Starting public API server...");

      await core.withSupabaseClient(
        {
          url: config.supabaseUrl,
          serviceRoleKey: config.supabaseServiceRoleKey,
        },
        () =>
          core.withDatabase({ connectionString: config.pgUri }, async () => {
            const app = createApp();

            const server = serve({
              fetch: app.fetch,
              port: config.port,
            });

            const actualPort = config.port;
            core.info(`Public API server listening on :${actualPort}`);

            await waitForSignal();

            core.info("Stopping server...");
            await new Promise<void>((resolve, reject) =>
              server.close((err) => (err ? reject(err) : resolve())),
            );
          }),
      );

      core.info("Server stopped");
    } catch (error) {
      core.error(error);
      process.exit(1);
    }
  });
}

function waitForSignal(): Promise<void> {
  return new Promise((resolve) => {
    const onSignal = () => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      resolve();
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
  });
}
