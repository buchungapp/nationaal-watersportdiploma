import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import { schema, withDatabase } from "nwd-db";
import { withServer } from "../../testing/index.js";

test("echo-via-get", () =>
  withDatabase(async ({ db }) =>
    withServer({ db }, async ({ baseUrl, server }) => {
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

      const rows = await db
        .select({
          message: schema.echoMessages.messageValue,
        })
        .from(schema.echoMessages);
      assert.deepEqual(rows, [
        {
          message,
        },
      ]);
    }),
  ));
