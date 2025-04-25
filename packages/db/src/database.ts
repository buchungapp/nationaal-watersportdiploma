import path from "node:path";
import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import type { PoolConfig } from "pg";
import { projectRoot } from "./root.js";
import * as schema from "./schema/index.js";
import type { FullSchema } from "./types.js";
import * as uncontrolledSchema from "./uncontrolled_schema/index.js";

export type Database = NodePgDatabase<FullSchema>;
export type CreateDatabaseOptions = string | PoolConfig;
export class DatabaseError extends pg.DatabaseError {}

export function createDatabase(options: CreateDatabaseOptions) {
  const pool =
    typeof options === "string"
      ? new pg.Pool({ connectionString: options })
      : new pg.Pool(options);

  const db = drizzle(pool, {
    schema: {
      ...schema,
      ...uncontrolledSchema,
    },
    logger: process.env.DRIZZLE_LOG === "true",
  });

  return db;
}

export async function migrateDatabase(db: NodePgDatabase<FullSchema>) {
  await migrate(db, {
    migrationsFolder: path.join(projectRoot, "migrations"),
  });
}
