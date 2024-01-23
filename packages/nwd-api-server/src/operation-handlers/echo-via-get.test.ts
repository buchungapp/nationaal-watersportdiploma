import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import { withDatabase } from "nwd-db";
import { withServer } from "../testing/index.js";

test("echo-via-get", () =>
  withDatabase(async ({ pgPool }) =>
    withServer({ pgPool }, async ({ baseUrl, server }) => {
      const message = "hello";
      const operationResult = await api.echoViaGet(
        {
          parameters: {
            message,
          },
          contentType: null,
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
