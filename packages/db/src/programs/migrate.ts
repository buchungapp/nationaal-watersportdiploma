import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type * as yargs from "yargs";
import { migrateDatabase } from "../database.js";
import * as schema from "../schema/index.js";

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

  const pgSql = postgres(pgUri, {
    max: 1,
  });

  try {
    const db = drizzle(pgSql, {
      schema,
      logger: process.env.DRIZZLE_LOG === "true",
    });
    // migrate the database
    await migrateDatabase(db);
  } finally {
    await pgSql.end();
  }

  console.info("Migration end");
}
