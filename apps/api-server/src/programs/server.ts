import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as yargs from "yargs";
import * as application from "../application/index.js";
import { waitForSignal } from "../utils/index.js";

export function configureServerProgram(argv: yargs.Argv) {
  return argv.command(
    "server",
    "Start a server",
    (yargs) =>
      yargs
        .option("port", {
          description: "port for the server to listen to",
          type: "number",
          demandOption: true,
        })
        .option("pg-uri", {
          description: "connection string for postgres",
          type: "string",
          demandOption: true,
        })
        .option("supabase-url", {
          description: "url to supabase",
          type: "string",
          demandOption: true,
        })
        .option("supabase-service-role-key", {
          description: "supabase service role key",
          type: "string",
          demandOption: true,
        }),
    (argv) => main(argv),
  );
}

interface MainConfiguration {
  port: number;
  pgUri: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

async function main(configuration: MainConfiguration) {
  // TODO support appsignal
  const logConfiguration = core.consoleLogConfiguration();

  await core.withLog(logConfiguration, async () => {
    try {
      const { port, pgUri, supabaseUrl, supabaseServiceRoleKey } =
        configuration;

      core.info("Starting server...");

      await core.withSupabaseClient(
        {
          url: supabaseUrl,
          serviceRoleKey: supabaseServiceRoleKey,
        },
        () =>
          core.withDatabase({ connectionString: pgUri }, async () => {
            const server = application.createApplicationServer();
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
}
