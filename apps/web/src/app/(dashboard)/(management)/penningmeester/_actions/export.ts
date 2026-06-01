"use server";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { canViewFinancialReport } from "~/lib/authorization";
import dayjs from "~/lib/dayjs";
import {
  createExportData,
  exportDataToBlob,
  exportFileName,
} from "~/lib/export";
import { getUserOrThrow } from "~/lib/nwd";
import {
  listCertificateCountsByLocation,
  listCertificateDetailByLocation,
} from "../_components/queries";

// Inclusive Amsterdam calendar dates. Strict format here is defense in depth;
// amsterdamPeriodToUtcBounds also strict-validates (rejecting rolled-over dates
// like 2026-02-31) before any query runs.
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Verwacht datumformaat YYYY-MM-DD");

const exportSchema = z.object({
  from: dateSchema,
  to: dateSchema,
  kind: z.enum(["samenvatting", "detail"]),
  format: z.enum(["csv", "xlsx"]),
});

export const exportPenningmeesterReportAction = actionClientWithMeta
  .metadata({ name: "export-penningmeester-report" })
  .inputSchema(exportSchema)
  .action(async ({ parsedInput: { from, to, kind, format } }) => {
    // Defense in depth: the underlying queries also gate, but a server action is
    // independently callable, so we check here too.
    const user = await getUserOrThrow();
    if (!canViewFinancialReport(user.email)) {
      throw new Error("Geen toegang tot de penningmeester-rapportage.");
    }

    let headers: string[];
    let rows: string[][];
    let sheetName: string;

    if (kind === "samenvatting") {
      const counts = await listCertificateCountsByLocation(from, to);
      headers = ["Locatie", "Handle", "Consument", "Instructeur", "Totaal"];
      rows = counts.map((c) => [
        c.locationName,
        c.locationHandle,
        String(c.consument),
        String(c.instructeur),
        String(c.totaal),
      ]);
      sheetName = "Samenvatting";
    } else {
      const detail = await listCertificateDetailByLocation(from, to);
      headers = ["Certificaat", "Locatie", "Handle", "Type", "Uitgegeven op"];
      rows = detail.map((d) => [
        d.handle,
        d.locationName,
        d.locationHandle,
        d.type,
        // Format as the Amsterdam-local issue date. issuedAt is a UTC instant;
        // showing it raw would dispute-bait around Amsterdam midnight.
        d.issuedAt
          ? dayjs(d.issuedAt).tz("Europe/Amsterdam").format("YYYY-MM-DD")
          : "",
      ]);
      sheetName = "Detail";
    }

    const data = await createExportData(
      headers,
      rows,
      format === "xlsx" ? { type: "xlsx", sheetName } : { type: "csv" },
    );

    return {
      data: exportDataToBlob(data, format),
      format,
      // exportFileName prepends an export timestamp (YYYY-MM-DDTHH:mm); the
      // period is encoded too, so the downloaded file is a self-identifying
      // billing snapshot.
      filename: exportFileName(
        format,
        `penningmeester-${kind}-${from}_tot_${to}`,
      ),
    };
  });
