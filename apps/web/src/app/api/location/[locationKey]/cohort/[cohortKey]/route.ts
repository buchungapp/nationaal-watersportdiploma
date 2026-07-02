import { handleImportSessionApiRequest } from "~/app/api/_lib/import-session";

export function PUT(request: Request) {
  return handleImportSessionApiRequest(request);
}
