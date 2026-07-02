import type { NextRequest } from "next/server";
import { listLocationCohortImportSessions } from "~/app/api/_lib/import-session";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      locationKey: string;
      cohortKey: string;
    }>;
  },
) {
  return listLocationCohortImportSessions(request, await context.params);
}
