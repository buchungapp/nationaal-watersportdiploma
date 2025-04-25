import { AsyncLocalStorage } from "node:async_hooks";
import cp from "node:child_process";
import * as db from "@nawadi/db";
import { trace } from "@opentelemetry/api";

export type DatabaseConfiguration = db.CreateDatabaseOptions;

// Instance of AsyncLocalStorage to maintain database connections scoped to specific async operations.
const storage = new AsyncLocalStorage<ReturnType<typeof db.createDatabase>>();

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
 * Sets up a global database connection for the current process if one doesn't already exist.
 * Automatically cleans up the connection when the process exits.
 *
 * @param {DatabaseConfiguration} configuration - The database configuration.
 */
export function initializeProcessScopedDatabase(
  options: DatabaseConfiguration,
): () => Promise<void> {
  // Helper function to create and setup database connection
  const setupDatabase = () => {
    const database = db.createDatabase(options);

    // @ts-expect-error find a way to type global accross packages
    globalThis.__serverlessPool = database;

    storage.enterWith(database);
    return database;
  };

  // Helper function to setup cleanup handlers
  const setupCleanupHandlers = (
    database: ReturnType<typeof db.createDatabase>,
  ) => {
    return async () => {
      await database.$client.end();
      // @ts-expect-error find a way to type global accross packages
      globalThis.__serverlessPool = null;
    };
  };

  // @ts-expect-error find a way to type global accross packages
  const existingDb = globalThis.__serverlessPool;

  if (existingDb) {
    return setupCleanupHandlers(existingDb);
  }

  const database = setupDatabase();
  return setupCleanupHandlers(database);
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
      // @ts-expect-error find a way to type global accross packages
      const database = storage.getStore() ?? globalThis.__serverlessPool;
      if (database == null) {
        span.setAttribute("database.error", "not_in_context");
        throw new TypeError("Database not in context");
      }
      span.setAttribute("database.exists", true);
      return database;
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
