import path from "node:path";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Sql } from "postgres";
import { projectRoot } from "./root.js";
import * as schema from "./schema/index.js";

export type Database = PostgresJsDatabase<typeof schema>;
export function createDatabase(pgSql: Sql) {
  const db = drizzle(pgSql, {
    schema,
    logger: process.env.DRIZZLE_LOG === "true",
  });
  return db;
}

export async function migrateDatabase(db: PostgresJsDatabase<typeof schema>) {
  await migrate(db, {
    migrationsFolder: path.join(projectRoot, "migrations"),
  });
}
