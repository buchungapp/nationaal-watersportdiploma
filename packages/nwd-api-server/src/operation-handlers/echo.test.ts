import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import { withServer } from "../testing/index.js";

test("echo", () =>
  withServer(async ({ baseUrl, server }) => {
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
  }));
