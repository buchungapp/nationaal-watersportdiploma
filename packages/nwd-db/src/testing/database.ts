import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import pg from "pg";
import { Database } from "../database.js";
import * as schema from "../schema/index.js";
import { projectRoot } from "../utils/index.js";

export interface DatabaseContext {
  pgPool: pg.Pool;
  db: Database;
}

export async function withDatabase<T>(job: (context: DatabaseContext) => Promise<T>) {
  const databaseName = `db_${new Date().valueOf()}`;

  const pgUriSuper = new URL(process.env.PGURI || "postgres://postgres@localhost:5432/postgres");
  const pgUri = new URL(databaseName, pgUriSuper);

  const pgPoolSuper = new pg.Pool({
    connectionString: pgUriSuper.toString(),
  });
  try {
    await pgPoolSuper.query(`CREATE DATABASE ${databaseName};`);
    try {
      {
        // use a single connection pool for the migration
        const pgPool = new pg.Pool({
          connectionString: pgUri.toString(),
          max: 1,
        });
        try {
          const db = drizzle(pgPool);
          await migrate(db, { migrationsFolder: path.join(projectRoot, "migrations") });
        } finally {
          await pgPool.end();
        }
      }
      {
        // use a normal pool for the queries
        const pgPool = new pg.Pool({
          connectionString: pgUri.toString(),
        });
        try {
          const db = drizzle(pgPool, { schema });
          const result = await job({ pgPool, db });
          return result;
        } finally {
          await pgPool.end();
        }
      }
    } finally {
      await pgPoolSuper.query(`DROP DATABASE ${databaseName};`);
    }
  } finally {
    await pgPoolSuper.end();
  }
}
