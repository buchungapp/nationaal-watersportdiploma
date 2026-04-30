import { User, withDatabase } from "@nawadi/core";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Vercel cron route. Runs hourly per vercel.json. Deletes expired active
 * bulk_import_preview rows (TTL = 1 hour) and purges committed/invalidated
 * rows older than 30 days (forensics retention window).
 *
 * Authenticates via the standard Vercel Cron `Authorization: Bearer
 * ${CRON_SECRET}` header. Returns 401 if the secret is missing or wrong.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.PGURI) {
    return NextResponse.json(
      { error: "PGURI not configured" },
      { status: 500 },
    );
  }

  const result = await withDatabase(
    { connectionString: process.env.PGURI },
    () => User.Person.cleanupExpiredBulkImportPreviews({}),
  );

  return NextResponse.json({
    ok: true,
    activeExpired: result.activeExpired,
    historicalPurged: result.historicalPurged,
  });
}
