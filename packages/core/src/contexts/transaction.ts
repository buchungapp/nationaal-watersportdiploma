import { AsyncLocalStorage } from "node:async_hooks";
import * as db from "@nawadi/db";
import postgres from "postgres";
import { useDatabase, withDatabase } from "./database.js";

// Initializes an instance of AsyncLocalStorage to store database transaction contexts.
const storage = new AsyncLocalStorage<db.Transaction>();

/**
 * Executes a given job within a database transaction.
 *
 * This function automatically manages the lifecycle of a database transaction. It looks for an
 * existing transaction in the current AsyncLocalStorage context, and if one is found, it executes
 * the provided job within this transaction. If no transaction is found, it creates a new transaction
 * and executes the job within it. The transaction is committed if the job completes successfully,
 * or rolled back if an error occurs.
 *
 * @param job A function that performs operations within a transaction and returns a promise.
 * @returns Returns a promise that resolves with the result of the job function if the transaction
 *          is successfully committed, or rejects with an error if the transaction fails or the job
 *          throws an error.
 */
export async function withTransaction<T>(
  job: (tx: db.Transaction) => Promise<T>,
): Promise<T> {
  const existingTransaction = useTransaction();

  if (existingTransaction) {
    // If an existing transaction is found, run the job within it
    return job(existingTransaction);
  }
  // If no existing transaction is found, create a new transaction
  const database = useDatabase();
  return database.transaction(
    async (transaction) => {
      // Run the job within the newly created transaction context
      const result = await storage.run(transaction, () => job(transaction));
      return result;
    },
    {
      isolationLevel: "serializable",
    },
  );
}

/**
 * Retrieves the current database transaction from the AsyncLocalStorage.
 *
 * This function can be used within a job running in `withTransaction` to access the current
 * database transaction context. It allows operations within the job to participate in the
 * transaction initiated by `withTransaction`.
 *
 * @returns The current database transaction if one is active in the AsyncLocalStorage context,
 *          otherwise undefined.
 */
export function useTransaction(): db.Transaction | undefined {
  const context = storage.getStore();
  return context;
}

/**
 *
 * Migrates the local supabase database to the latest version and then runs the job
 * with a database context that points to the local supabase database. The job is run
 * in a transaction that is rolled back at the end of the job so that the database
 * is kept clean
 *
 * @param job async test job to run
 * @returns whatever the job returns
 */
export async function withTestTransaction<T>(
  job: () => Promise<T>,
): Promise<T> {
  const pgUri =
    process.env.PGURI ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  {
    // use a single connection pool for the migration
    const pgSql = postgres(pgUri.toString(), {
      max: 1,
      onnotice: () => {},
    });
    try {
      const database = db.createDatabase(pgSql);
      // migrate (set up) the database
      await db.migrateDatabase(database);
    } finally {
      await pgSql.end();
    }
  }

  const result = await withDatabase({ pgUri }, async () => {
    const rollback = Symbol();
    let result: T;
    try {
      await withTransaction(async () => {
        result = await job();
        // the transaction is aborted when an error is thrown! There is also a rollback
        // method on the transaction. This will not rollback the transaction, this method will
        // throw.
        // We throw our own symbol so we can easily recognize it in the catch block
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) {
        throw error;
      }
    }
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return result!;
  });

  return result;
}
