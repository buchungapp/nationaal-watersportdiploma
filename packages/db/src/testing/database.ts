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
  // run only if configured
  if (process.env.PGURI == null) {
    return;
  }

  // a (semi) random database name
  const databaseName = `db_${new Date().valueOf()}`;

  const pgUriSuper = new URL(process.env.PGURI);
  const pgUri = new URL(databaseName, pgUriSuper);

  // create a pool that will be used to create and destroy a database
  const pgPoolSuper = new pg.Pool({
    connectionString: pgUriSuper.toString(),
  });
  try {
    // create a temporary database that we only use for testing
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
          // migrate (set up) the database
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
          // run the job with the database test context
          const result = await job({ pgPool, db });
          return result;
        } finally {
          await pgPool.end();
        }
      }
    } finally {
      // finally drop the test-database
      await pgPoolSuper.query(`DROP DATABASE ${databaseName};`);
    }
  } finally {
    // finally end the super pool
    await pgPoolSuper.end();
  }
}
