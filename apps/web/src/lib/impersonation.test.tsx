import { describe, expect, it } from "vitest";
import {
  assertCanImpersonateTarget,
  assertCanUseImpersonation,
} from "./impersonation";

describe("assertCanUseImpersonation", () => {
  it("allows system administrators", () => {
    expect(() => assertCanUseImpersonation("maurits@buchung.nl")).not.toThrow();
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
        targetEmail: "jeroen@buchung.nl",
      }),
    ).toThrow("Je kunt geen systeembeheerder impersoneren.");
  });
});
