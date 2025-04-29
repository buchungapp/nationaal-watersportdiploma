import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { invariant } from "@nawadi/lib";
import * as application from "./application/index.js";
import { waitForSignal } from "./utils/signal.js";

function main() {
  const server = application.createApplicationServer();
  const logConfiguration = core.consoleLogConfiguration();

  const start = async () => {
    const port = process.env.PORT ? Number(process.env.PORT) : 2022;
    const pgUri = process.env.PGURI;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    invariant(pgUri, "PG_URI is not set");
    invariant(supabaseUrl, "SUPABASE_URL is not set");
    invariant(supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is not set");
    invariant(
      Number.isInteger(port) && port > 0,
      "PORT must be a positive integer",
    );

    core.info("Starting server...");

    await core.withLog(logConfiguration, async () => {
      try {
        await core.withSupabaseClient(
          {
            url: supabaseUrl,
            serviceRoleKey: supabaseServiceRoleKey,
          },
          () =>
            core.withDatabase({ connectionString: pgUri }, async () => {
              await using listener = await api.lib.listen(server, { port });

              core.info(`Server started (${listener.port})`);

              await waitForSignal("SIGINT", "SIGTERM");

              core.info("Stopping server...");
            }),
        );

        core.info("Server stopped");
      } catch (error) {
        core.error(error);

        process.exit(1);
      }
    });
  };

  return start();
}

main();
