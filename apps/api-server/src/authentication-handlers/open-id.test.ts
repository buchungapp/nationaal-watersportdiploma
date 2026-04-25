import assert from "node:assert";
import test from "node:test";
import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { withTestEnvironment } from "../testing/index.js";

test("open-id authentication", () =>
  withTestEnvironment({ isolation: "supabase" }, async ({ baseUrl }) => {
    const email = "test@test.test";
    const user = await core.Auth.getOrCreateUser({
      email,
      displayName: "test user",
    });

    const auth = core.Auth.getBetterAuth();
    const otp = await auth.api.createVerificationOTP({
      body: { email, type: "sign-in" },
    });
    assert(typeof otp === "string");

    const signInResponse = await auth.api.signInEmailOTP({
      body: { email, otp },
      asResponse: true,
    });

    const token = signInResponse.headers.get("set-auth-token");
    assert(token, "Better Auth session token missing from response");

    const result = await api.client.me(
      {
        contentType: null,
        parameters: {},
      },
      { openId: token },
      { baseUrl },
    );

    assert(result.status === 200);

    const meItem = await result.entity();
    assert.equal(meItem.id, user.id);
  }));
