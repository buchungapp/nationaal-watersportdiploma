import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import { withDatabase, withServer } from "../testing/index.js";

test("echo", () =>
  withDatabase(async ({ pgPool }) =>
    withServer({ pgPool }, async ({ baseUrl, server }) => {
      const message = "hello";
      const operationResult = await api.echo(
        {
          parameters: {},
          contentType: "application/json",
          entity: () => ({ message }),
        },
        {},
        {
          baseUrl,
        },
      );

      assert.equal(operationResult.status, 200);

      const entity = await operationResult.entity();
      assert.equal(entity.message, message);

      const pgResult = await pgPool.query(`
        select message_value
        from echo_messages
      `);
      assert.deepEqual(pgResult.rows, [
        {
          message_value: message,
        },
      ]);
    }),
  ));
