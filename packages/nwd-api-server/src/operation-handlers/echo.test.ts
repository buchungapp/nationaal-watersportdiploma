import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import * as application from "../application/index.js";
import { withServer } from "../testing/index.js";

test("echo", async () => {
  const context: application.Context = { count: 0 };
  await withServer(context, async ({ baseUrl, server }) => {
    assert.equal(context.count, 0);

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

    assert.equal(context.count, 1);
  });
});
