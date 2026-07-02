import type { NextRequest } from "next/server";
import { retrieveLocationImportSession } from "~/app/api/_lib/import-session";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      locationKey: string;
      externalSessionKey: string;
    }>;
  },
) {
  return retrieveLocationImportSession(request, await context.params);
}
