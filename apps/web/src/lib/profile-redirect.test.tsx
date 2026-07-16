import { describe, expect, it } from "vitest";
import { getProfileRedirectPath } from "./profile-redirect";

describe("getProfileRedirectPath", () => {
  it("redirects to the primary person's profile", () => {
    expect(
      getProfileRedirectPath([
        { handle: "secondary-person", isPrimary: false },
        { handle: "primary-person", isPrimary: true },
      ]),
    ).toBe("/profiel/primary-person");
  });

  it("redirects to account setup when no primary person exists", () => {
    expect(
      getProfileRedirectPath([
        { handle: "person-without-primary-status", isPrimary: false },
      ]),
    ).toBe("/account");
  });
});
