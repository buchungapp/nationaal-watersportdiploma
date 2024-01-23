import assert from "node:assert";
import test from "node:test";
import { withDatabase } from "./database.js";

test("with-database", () =>
  withDatabase(async ({ pgPool }) => {
    const result = await pgPool.query("SELECT 1 as one");
    assert.deepEqual(result.rows, [{ one: 1 }]);
  }));
