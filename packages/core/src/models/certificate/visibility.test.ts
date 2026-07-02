import assert from "node:assert";
import test from "node:test";
import dayjs from "dayjs";
import {
  assertCertificateVisibilityStillMutable,
  assertVisibleFromWithinAllowedDelay,
} from "./visibility.ts";

test("certificate visibility can be delayed by at most 72 hours", () => {
  const issuedAt = dayjs("2026-07-02T12:00:00.000Z");

  assert.doesNotThrow(() =>
    assertVisibleFromWithinAllowedDelay({
      issuedAt: issuedAt.toISOString(),
      visibleFrom: issuedAt.add(72, "hour").toISOString(),
    }),
  );

  assert.throws(
    () =>
      assertVisibleFromWithinAllowedDelay({
        issuedAt: issuedAt.toISOString(),
        visibleFrom: issuedAt
          .add(72, "hour")
          .add(1, "millisecond")
          .toISOString(),
      }),
    /at most 72 hours/,
  );
});

test("certificate visibility can only be changed within 72 hours after issuance", () => {
  assert.doesNotThrow(() =>
    assertCertificateVisibilityStillMutable({
      issuedAt: dayjs().subtract(71, "hour").toISOString(),
    }),
  );

  assert.throws(
    () =>
      assertCertificateVisibilityStillMutable({
        issuedAt: dayjs().subtract(73, "hour").toISOString(),
      }),
    /only be changed within 72 hours/,
  );
});
