import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { runServer } from "./server.js";

main();

async function main() {
  const program = yargs(hideBin(process.argv));

  program.command(
    "server",
    "Start the public API server",
    (y) =>
      y
        .option("port", {
          description: "port for the server to listen on",
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
    async (argv) => {
      await runServer({
        port: argv.port,
        pgUri: argv["pg-uri"],
        supabaseUrl: argv["supabase-url"],
        supabaseServiceRoleKey: argv["supabase-service-role-key"],
      });
    },
  );

  program.demandCommand();
  program.strict();

  await program.parseAsync();
}
