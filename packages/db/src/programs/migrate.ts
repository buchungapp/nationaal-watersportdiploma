import type * as yargs from "yargs";
import { createDatabase, migrateDatabase } from "../database.js";

export function configureMigrateProgram(argv: yargs.Argv) {
  return argv.command(
    "migrate",
    "Migrates database to the current version",
    (yargs) =>
      yargs.option("pg-uri", {
        description: "connection string for postgres",
        type: "string",
        demandOption: true,
      }),
    (argv) => main(argv),
  );
}

interface MainConfiguration {
  pgUri: string;
}

async function main(configuration: MainConfiguration) {
  const { pgUri } = configuration;

  console.info("Migration start");

  const db = createDatabase({
    connectionString: pgUri,
    max: 1,
  });

  try {
    await migrateDatabase(db);
  } finally {
    await db.$client.end();
  }

  console.info("Migration end");
}
