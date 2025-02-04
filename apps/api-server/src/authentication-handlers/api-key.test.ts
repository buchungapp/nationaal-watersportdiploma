import assert from "node:assert";
import test from "node:test";
import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { withTestEnvironment } from "../testing/index.js";

test("api-key authentication", () =>
  withTestEnvironment({ isolation: "supabase" }, async ({ baseUrl }) => {
    const userItem = await core.User.getOrCreateFromEmail({
      email: "test@test.test",
      displayName: "test harry",
    });

    const apiKeyItem = await core.ApiKey.createForUser({
      name: "test api-key",
      userId: userItem.id,
    });

    const result = await api.client.me(
      {
        contentType: null,
        parameters: {},
      },
      { apiKey: apiKeyItem.token },
      { baseUrl },
    );

    assert(result.status === 200);

    const meItem = await result.entity();
    assert.equal(meItem.id, userItem.id);
  }));
