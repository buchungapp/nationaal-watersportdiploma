import dayjs, { type Dayjs } from "~/lib/dayjs";

const TIMEZONE = "Europe/Amsterdam";

/**
 * First day of the quarter containing `d` (months 0,3,6,9), as a day-start.
 *
 * Sets the day to 1 BEFORE changing the month. dayjs's `.month()` setter uses
 * Date.setMonth(), which rolls over when the current day-of-month exceeds the
 * target month's length: on May 31, `.month(3)` (April) would overflow to
 * May 1, producing the wrong quarter. `.date(1)` first avoids that.
 */
export function startOfQuarter(d: Dayjs): Dayjs {
  const quarterStartMonth = Math.floor(d.month() / 3) * 3;
  return d.date(1).month(quarterStartMonth).startOf("month");
}

export type UtcPeriodBounds = {
  /** Inclusive lower bound, UTC instant (ISO). */
  fromUtc: string;
  /** Exclusive upper bound, UTC instant (ISO). */
  toUtcExclusive: string;
};

/**
 * Convert an INCLUSIVE Amsterdam calendar-date range (both "YYYY-MM-DD") into a
 * HALF-OPEN UTC instant range [fromUtc, toUtcExclusive) suitable for comparing
 * the timestamptz `certificate.issued_at`.
 *
 *   from = "2026-01-01", to = "2026-01-31"
 *     -> [ 2026-01-01 00:00 Amsterdam , 2026-02-01 00:00 Amsterdam )  (as UTC)
 *
 * Why half-open + app-side conversion (not `AT TIME ZONE` in SQL):
 *  - Half-open avoids the inclusive-`<=` double-count at period boundaries: a
 *    certificate issued exactly at the next period's start is NOT billed twice.
 *  - Computing the UTC instants here keeps the query comparing the RAW indexed
 *    `issued_at` column, so `certificate_idx_location_issued_at` is still used.
 *  - dayjs.tz resolves the correct offset per boundary, so the late-March /
 *    late-October DST transitions don't shift the window by an hour. The day a
 *    clock springs forward is genuinely 23h long, and this handles it.
 */
export function amsterdamPeriodToUtcBounds(
  from: string,
  to: string,
): UtcPeriodBounds {
  // Strict-parse FIRST. dayjs.tz is lenient and silently rolls invalid dates
  // over (2026-13-01 -> Dec, 2026-02-31 -> Mar 3, 01-01-2026 -> Dec 2025) while
  // reporting them valid -- which would bill the WRONG period with no error.
  // Strict mode (3rd arg true) rejects anything that isn't a real YYYY-MM-DD.
  if (!dayjs(from, "YYYY-MM-DD", true).isValid()) {
    throw new Error(`Ongeldige 'from'-datum (verwacht YYYY-MM-DD): ${from}`);
  }
  if (!dayjs(to, "YYYY-MM-DD", true).isValid()) {
    throw new Error(`Ongeldige 'to'-datum (verwacht YYYY-MM-DD): ${to}`);
  }

  const start = dayjs.tz(from, TIMEZONE).startOf("day");
  // The treasurer picks an inclusive end date; the exclusive upper bound is the
  // start of the following day, in Amsterdam, converted to its UTC instant.
  const endExclusive = dayjs.tz(to, TIMEZONE).add(1, "day").startOf("day");

  if (!start.isValid() || !endExclusive.isValid()) {
    throw new Error(`Ongeldige periode: from=${from} to=${to}`);
  }
  if (!endExclusive.isAfter(start)) {
    throw new Error(
      `Lege periode: 'from' (${from}) moet op of voor 'to' (${to}) liggen`,
    );
  }

  return {
    fromUtc: start.toISOString(),
    toUtcExclusive: endExclusive.toISOString(),
  };
}
