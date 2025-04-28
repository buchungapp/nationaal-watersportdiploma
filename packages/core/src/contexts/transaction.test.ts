import assert from "node:assert";
import test from "node:test";
import { sql } from "drizzle-orm";
import { useQuery } from "./query.js";
import { withTestTransaction, withTransaction } from "./transaction.js";

test("with-test-transaction", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const result = await query.execute(sql`SELECT 1 as one`);

    assert.deepStrictEqual(result.rows, [
      {
        one: 1,
      },
    ]);
  }));

test("withTransaction should not retry job on error", async () =>
  withTestTransaction(async () => {
    let transactionCount = 0;

    async function failingJob() {
      transactionCount += 1;
      // Simulate a job that throws an error
      throw new Error("Test error");
    }

    try {
      await withTransaction(failingJob);
    } catch (error) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, "Test error");
      } else {
        throw error; // Re-throw if it's not an Error instance
      }
    }

    // Ensure the job was only executed once
    assert.strictEqual(transactionCount, 1, "Job should not be retried");
  }));
