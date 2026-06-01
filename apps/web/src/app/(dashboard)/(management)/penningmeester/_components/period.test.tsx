// Pure-logic test, run by vitest (`pnpm --filter @nawadi/web test:components`).
// Validates the billing-critical Amsterdam -> UTC half-open boundary math,
// including the DST transitions where a naive conversion is off by an hour.
import { describe, expect, it } from "vitest";
import { amsterdamPeriodToUtcBounds } from "./period";

describe("amsterdamPeriodToUtcBounds", () => {
  it("winter month maps Amsterdam midnight to the UTC+1 instant (half-open)", () => {
    const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(
      "2026-01-01",
      "2026-01-31",
    );
    // 2026-01-01 00:00 Amsterdam (CET, +1) == 2025-12-31T23:00:00Z
    expect(fromUtc).toBe("2025-12-31T23:00:00.000Z");
    // exclusive end = 2026-02-01 00:00 Amsterdam (+1) == 2026-01-31T23:00:00Z
    expect(toUtcExclusive).toBe("2026-01-31T23:00:00.000Z");
  });

  it("summer month maps Amsterdam midnight to the UTC+2 instant", () => {
    const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(
      "2026-07-01",
      "2026-07-31",
    );
    // 2026-07-01 00:00 Amsterdam (CEST, +2) == 2026-06-30T22:00:00Z
    expect(fromUtc).toBe("2026-06-30T22:00:00.000Z");
    expect(toUtcExclusive).toBe("2026-07-31T22:00:00.000Z");
  });

  it("spring-forward day (2026-03-29) is a 23-hour window", () => {
    const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(
      "2026-03-29",
      "2026-03-29",
    );
    // Midnight Mar 29 is still CET (+1); clocks spring at 02:00 -> CEST (+2).
    expect(fromUtc).toBe("2026-03-28T23:00:00.000Z");
    expect(toUtcExclusive).toBe("2026-03-29T22:00:00.000Z");
    const hours =
      (Date.parse(toUtcExclusive) - Date.parse(fromUtc)) / 3_600_000;
    expect(hours).toBe(23);
  });

  it("fall-back day (2026-10-25) is a 25-hour window", () => {
    const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(
      "2026-10-25",
      "2026-10-25",
    );
    const hours =
      (Date.parse(toUtcExclusive) - Date.parse(fromUtc)) / 3_600_000;
    expect(hours).toBe(25);
  });

  it("upper bound is exclusive: start of the day AFTER `to`", () => {
    const { toUtcExclusive } = amsterdamPeriodToUtcBounds(
      "2026-05-01",
      "2026-05-31",
    );
    // 2026-06-01 00:00 Amsterdam (+2) == 2026-05-31T22:00:00Z
    expect(toUtcExclusive).toBe("2026-05-31T22:00:00.000Z");
  });

  it("throws on a reversed/empty period", () => {
    expect(() =>
      amsterdamPeriodToUtcBounds("2026-05-31", "2026-05-01"),
    ).toThrow();
  });

  it("throws on an invalid date", () => {
    expect(() =>
      amsterdamPeriodToUtcBounds("not-a-date", "2026-05-01"),
    ).toThrow();
  });
});
