import { describe, expect, it, vi } from "vitest";

vi.mock("./authorization", () => ({
  isSystemAdmin: vi.fn(
    (email: string | null | undefined) => email === "admin@example.nl",
  ),
}));

import {
  assertCanImpersonateTarget,
  assertCanUseImpersonation,
} from "./impersonation";

describe("assertCanUseImpersonation", () => {
  it("allows system administrators", () => {
    expect(() => assertCanUseImpersonation("admin@example.nl")).not.toThrow();
  });

  it("rejects non-administrators", () => {
    expect(() => assertCanUseImpersonation("support@example.nl")).toThrow(
      "Unauthorized",
    );
  });
});

describe("assertCanImpersonateTarget", () => {
  it("allows a regular support target", () => {
    expect(() =>
      assertCanImpersonateTarget({
        operatorUserId: "admin-user",
        targetUserId: "target-user",
        targetEmail: "target@example.nl",
      }),
    ).not.toThrow();
  });

  it("rejects self-impersonation", () => {
    expect(() =>
      assertCanImpersonateTarget({
        operatorUserId: "same-user",
        targetUserId: "same-user",
        targetEmail: "target@example.nl",
      }),
    ).toThrow("Je kunt je eigen account niet impersoneren.");
  });

  it("rejects impersonating another system administrator", () => {
    expect(() =>
      assertCanImpersonateTarget({
        operatorUserId: "admin-user",
        targetUserId: "other-admin-user",
        targetEmail: "admin@example.nl",
      }),
    ).toThrow("Je kunt geen systeembeheerder impersoneren.");
  });
});
