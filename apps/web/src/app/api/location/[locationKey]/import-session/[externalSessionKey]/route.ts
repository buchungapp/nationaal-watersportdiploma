import { handleImportSessionApiRequest } from "~/app/api/_lib/import-session";

export function GET(request: Request) {
  return handleImportSessionApiRequest(request);
}
