import assert from "node:assert";
import { AsyncLocalStorage } from "node:async_hooks";
import cp from "node:child_process";
import * as db from "@nawadi/db";
import { trace } from "@opentelemetry/api";

export type DatabaseConfiguration = db.CreateDatabaseOptions;

type Database = ReturnType<typeof db.createDatabase>;

// Instance of AsyncLocalStorage to maintain database connections scoped to specific async operations.
const storage = new AsyncLocalStorage<Database>();

let defaultDatabase: Database | undefined = undefined;

/**
 * Executes a given job with a database connection.
 * This function initializes a database connection using the provided configuration,
 * runs the provided job within the context of that database connection, and then
 * closes the connection.
 *
 * @template T The type of the result returned by the job function.
 * @param {DatabaseConfiguration} configuration - The database configuration.
 * @param {() => Promise<T>} job - A function representing the job to be executed with the database connection.
 * @returns {Promise<T>} A promise that resolves with the result of the job function.
 */
export async function withDatabase<T>(
  options: DatabaseConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const database = db.createDatabase(options);
  try {
    const result = await storage.run(database, job);
    return result;
  } finally {
    await database.$client.end();
  }
}

/**
 * Retrieves the current database connection from the AsyncLocalStorage.
 * This function must be called within the context of a function wrapped by `withDatabase`,
 * otherwise, it throws an error indicating that the database is not in context.
 *
 * @returns {db.Database} The current database connection.
 * @throws {TypeError} If called outside of a `withDatabase` context.
 */
export function useDatabase(): db.Database {
  const tracer = trace.getTracer("useDatabase");

  return tracer.startActiveSpan("useDatabase", (span) => {
    try {
      {
        // use database from context
        const database = storage.getStore();
        if (database != null) {
          return database;
        }
      }

      {
        // use default database, if it exists
        const database = defaultDatabase;
        if (database != null) {
          return database;
        }
      }

      // lazily set default database and use that
      defaultDatabase = createDatabase();
      process.on("beforeExit", async (code) => {
        assert(defaultDatabase != null);
        await defaultDatabase.$client.end();
      });

      return defaultDatabase;
    } finally {
      span.end();
    }
  });
}

export async function withTestDatabase<T>(job: () => Promise<T>): Promise<T> {
  const pgUri =
    process.env.PGURI ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  try {
    // use a single connection pool for the migration
    const database = db.createDatabase({
      connectionString: pgUri,
      max: 1,
    });
    try {
      await db.migrateDatabase(database);
    } finally {
      await database.$client.end();
    }

    const result = await withDatabase(pgUri, job);
    return result;
  } finally {
    // reset database
    const options = { shell: true, stdio: "inherit" } as const;
    cp.execFileSync("pnpm", ["--filter", "supabase", "reset"], options);
  }
}

function createDatabase() {
  const database = db.createDatabase({
    connectionString: process.env.PGURI,
    max: 15,
  });
  return database;
}
