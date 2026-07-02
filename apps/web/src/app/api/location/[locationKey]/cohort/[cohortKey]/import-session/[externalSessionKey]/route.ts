import type { NextRequest } from "next/server";
import { upsertLocationCohortImportSession } from "~/app/api/_lib/import-session";

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      locationKey: string;
      cohortKey: string;
      externalSessionKey: string;
    }>;
  },
) {
  return upsertLocationCohortImportSession(request, await context.params);
}
