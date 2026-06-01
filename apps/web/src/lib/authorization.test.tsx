// Pure-logic test, run by vitest (`pnpm --filter @nawadi/web test:components`).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canViewFinancialReport,
  isEmailInAllowlist,
  isPenningmeester,
  isSystemAdmin,
} from "./authorization";

// PENNINGMEESTER_EMAILS extends the built-in allowlist via env; clear it per
// test so these assertions don't depend on the runtime environment.
const ORIGINAL_PM_EMAILS = process.env.PENNINGMEESTER_EMAILS;
beforeEach(() => {
  delete process.env.PENNINGMEESTER_EMAILS;
});
afterEach(() => {
  if (ORIGINAL_PM_EMAILS === undefined) {
    delete process.env.PENNINGMEESTER_EMAILS;
  } else {
    process.env.PENNINGMEESTER_EMAILS = ORIGINAL_PM_EMAILS;
  }
});

describe("isEmailInAllowlist", () => {
  const allowlist = ["Penningmeester@NWD.nl"];

  it("matches case-insensitively and trims whitespace", () => {
    expect(isEmailInAllowlist("penningmeester@nwd.nl", allowlist)).toBe(true);
    expect(isEmailInAllowlist("  PENNINGMEESTER@NWD.NL  ", allowlist)).toBe(
      true,
    );
  });

  it("rejects non-members and empty input", () => {
    expect(isEmailInAllowlist("someone@else.nl", allowlist)).toBe(false);
    expect(isEmailInAllowlist(null, allowlist)).toBe(false);
    expect(isEmailInAllowlist(undefined, allowlist)).toBe(false);
    expect(isEmailInAllowlist("", allowlist)).toBe(false);
  });
});

describe("canViewFinancialReport", () => {
  it("allows a sysadmin (so Buchung can view/support the report)", () => {
    expect(canViewFinancialReport("maurits@buchung.nl")).toBe(true);
  });

  it("denies a random logged-in user", () => {
    expect(canViewFinancialReport("random@user.nl")).toBe(false);
  });

  it("denies anonymous", () => {
    expect(canViewFinancialReport(null)).toBe(false);
    expect(canViewFinancialReport(undefined)).toBe(false);
  });
});

describe("allowlist separation", () => {
  it("a sysadmin is NOT a penningmeester (separate, least-privilege lists)", () => {
    expect(isPenningmeester("maurits@buchung.nl")).toBe(false);
  });

  it("isSystemAdmin recognizes a known admin", () => {
    expect(isSystemAdmin("jeroen@buchung.nl")).toBe(true);
  });
});

describe("configured penningmeester", () => {
  const treasurer = "penningmeester@nationaalwatersportdiploma.nl";

  it("allows the built-in treasurer mailbox (case-insensitive)", () => {
    expect(isPenningmeester(treasurer)).toBe(true);
    expect(
      isPenningmeester("Penningmeester@NationaalWatersportdiploma.NL"),
    ).toBe(true);
  });

  it("the treasurer can view the financial report", () => {
    expect(canViewFinancialReport(treasurer)).toBe(true);
  });
});
