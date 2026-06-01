"use server";
import { useQuery } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { and, asc, eq, gte, isNull, lt, sql } from "@nawadi/db/drizzle";
import { canViewFinancialReport } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import { amsterdamPeriodToUtcBounds } from "./period";

// A program whose degree rank is >= this is an instructor (kaderopleiding)
// program; below it is a consumer (eigenvaardigheid) program. The
// consumer/instructor split is a property of the PROGRAM (its degree.rang), NOT
// of the course. This constant is the single source of truth for the billing
// split. ("Anything above rank 4 is instructeur" -> rang >= 5.)
//
// NOT exported: a "use server" module may only export async functions, and this
// constant is used only within this file.
const INSTRUCTEUR_MIN_RANG = 5;

// ┌──────────────────────────────────────────────────────────────────────────┐
// │ certificate ─┬─ student_curriculum ─┬─ curriculum ─┬─ program ─┬─ degree   │
// │  (billable)  │   (one per cert)      │              │           │ (.rang)  │
// │              └─ location (issuing)                                          │
// │ Only certificate.deleted_at gates inclusion; the classification tables are │
// │ FK-joined WITHOUT their own deleted_at filter, so a later-retired program  │
// │ still classifies a certificate it issued (historical billing is stable).   │
// └──────────────────────────────────────────────────────────────────────────┘

async function assertCanViewFinancialReport() {
  // Redirects anonymous users to /login. Authorization is enforced HERE (inside
  // the server action), not only on the page render, because a server action is
  // an independently callable endpoint.
  const user = await getUserOrThrow();
  if (!canViewFinancialReport(user.email)) {
    throw new Error("Geen toegang tot de penningmeester-rapportage.");
  }
  return user;
}

function periodConditions(fromUtc: string, toUtcExclusive: string) {
  return and(
    isNull(s.certificate.deletedAt),
    // Count by issued_at, half-open [from, to). issued_at is nullable; a NULL
    // (not-yet-issued) certificate fails both comparisons and is intentionally
    // excluded from billing -- undated certificates are treated as not billable.
    gte(s.certificate.issuedAt, fromUtc),
    lt(s.certificate.issuedAt, toUtcExclusive),
  );
}

function typeForRang(rang: number): "Consument" | "Instructeur" {
  return rang >= INSTRUCTEUR_MIN_RANG ? "Instructeur" : "Consument";
}

type LocationCertificateCounts = {
  locationId: string;
  locationName: string;
  locationHandle: string;
  consument: number;
  instructeur: number;
  totaal: number;
};

/**
 * Per-location certificate counts in the period, split consumer vs instructor.
 * Aggregated in SQL (GROUP BY) and uses `count(distinct certificate.id)` so the
 * join path can never inflate a count. Only locations with >= 1 counted
 * certificate appear, regardless of location.status (an archived/hidden
 * location with billable activity must still be invoiced).
 */
export async function listCertificateCountsByLocation(
  from: string,
  to: string,
): Promise<LocationCertificateCounts[]> {
  const user = await assertCanViewFinancialReport();
  const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(from, to);
  const query = useQuery();

  const rows = await query
    .select({
      locationId: s.location.id,
      locationName: s.location.name,
      locationHandle: s.location.handle,
      consument:
        sql<number>`count(distinct ${s.certificate.id}) filter (where ${s.degree.rang} < ${INSTRUCTEUR_MIN_RANG})`.mapWith(
          Number,
        ),
      instructeur:
        sql<number>`count(distinct ${s.certificate.id}) filter (where ${s.degree.rang} >= ${INSTRUCTEUR_MIN_RANG})`.mapWith(
          Number,
        ),
    })
    .from(s.certificate)
    .innerJoin(
      s.studentCurriculum,
      eq(s.certificate.studentCurriculumId, s.studentCurriculum.id),
    )
    .innerJoin(
      s.curriculum,
      eq(s.studentCurriculum.curriculumId, s.curriculum.id),
    )
    .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
    .innerJoin(s.degree, eq(s.program.degreeId, s.degree.id))
    .innerJoin(s.location, eq(s.certificate.locationId, s.location.id))
    .where(periodConditions(fromUtc, toUtcExclusive))
    .groupBy(s.location.id, s.location.name, s.location.handle)
    .orderBy(asc(s.location.name));

  // Proportionate observability for an internal monthly tool: who ran which
  // period, and how many locations it touched. Log the opaque auth id, not the
  // email, to keep PII out of routine logs.
  console.info(
    `[penningmeester] report ${from}..${to} by ${user.authUserId} -> ${rows.length} location(s)`,
  );

  return rows.map((row) => ({
    locationId: row.locationId,
    locationName: row.locationName ?? row.locationHandle,
    locationHandle: row.locationHandle,
    consument: row.consument,
    instructeur: row.instructeur,
    totaal: row.consument + row.instructeur,
  }));
}

type CertificateDetailRow = {
  handle: string;
  locationName: string;
  locationHandle: string;
  type: "Consument" | "Instructeur";
  issuedAt: string | null;
};

/**
 * One row per certificate behind the counts: the evidence layer that makes an
 * exported file both dispute evidence and a dated billing snapshot.
 */
export async function listCertificateDetailByLocation(
  from: string,
  to: string,
): Promise<CertificateDetailRow[]> {
  await assertCanViewFinancialReport();
  const { fromUtc, toUtcExclusive } = amsterdamPeriodToUtcBounds(from, to);
  const query = useQuery();

  const rows = await query
    .select({
      handle: s.certificate.handle,
      issuedAt: s.certificate.issuedAt,
      locationName: s.location.name,
      locationHandle: s.location.handle,
      rang: s.degree.rang,
    })
    .from(s.certificate)
    .innerJoin(
      s.studentCurriculum,
      eq(s.certificate.studentCurriculumId, s.studentCurriculum.id),
    )
    .innerJoin(
      s.curriculum,
      eq(s.studentCurriculum.curriculumId, s.curriculum.id),
    )
    .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
    .innerJoin(s.degree, eq(s.program.degreeId, s.degree.id))
    .innerJoin(s.location, eq(s.certificate.locationId, s.location.id))
    .where(periodConditions(fromUtc, toUtcExclusive))
    .orderBy(asc(s.location.name), asc(s.certificate.issuedAt));

  return rows.map((row) => ({
    handle: row.handle,
    locationName: row.locationName ?? row.locationHandle,
    locationHandle: row.locationHandle,
    type: typeForRang(row.rang),
    issuedAt: row.issuedAt,
  }));
}
