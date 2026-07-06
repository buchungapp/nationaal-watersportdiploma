"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  commitKwalificatieBulkImportAsSystemAdmin,
  previewKwalificatieBulkImportAsSystemAdmin,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import {
  csvColumnLiteral,
  csvDataSchema,
  SELECT_LABEL,
} from "../person/person-bulk-csv-mappings";
import { parseKwalificatieRows } from "./kwalificatie-bulk-import-parser";

const previewInputSchema = zfd
  .formData(z.record(csvColumnLiteral, zfd.text()))
  .or(z.void());

const previewArgsSchema: [locationId: z.ZodString, csvData: typeof csvDataSchema] =
  [z.string().uuid(), csvDataSchema];

export const previewBulkImportKwalificatiesAction = actionClientWithMeta
  .metadata({ name: "kss.preview-bulk-import-kwalificaties" })
  .inputSchema(previewInputSchema)
  .bindArgsSchemas(previewArgsSchema)
  .action(
    async ({
      parsedInput: indexToColumnSelection,
      bindArgsParsedInputs: [locationId, csvData],
    }) => {
      if (!indexToColumnSelection) {
        if (!csvData?.rows?.[0]) {
          throw new Error("Geen data gevonden.");
        }
        return {
          kind: "needs-mapping" as const,
          columns: csvData.rows[0],
        };
      }

      const { rows, parseErrors } = parseKwalificatieRows(
        csvData,
        indexToColumnSelection as Record<string, string>,
      );

      if (rows.length === 0 && parseErrors.length > 0) {
        return {
          kind: "parse_errors" as const,
          parseErrors,
        };
      }

      const preview = await previewKwalificatieBulkImportAsSystemAdmin({
        locationId,
        rows,
      });

      return {
        kind: "previewed" as const,
        previewToken: preview.previewToken,
        results: preview.results,
        summary: preview.summary,
        parseErrors,
      };
    },
  );

const commitInputSchema = z.object({
  previewToken: z.string().uuid(),
  locationId: z.string().uuid(),
  defaultOpmerkingen: z.string().optional(),
});

export const commitBulkImportKwalificatiesAction = actionClientWithMeta
  .metadata({ name: "kss.commit-bulk-import-kwalificaties" })
  .inputSchema(commitInputSchema)
  .action(async ({ parsedInput }) => {
    const result = await commitKwalificatieBulkImportAsSystemAdmin({
      previewToken: parsedInput.previewToken,
      defaultOpmerkingen: parsedInput.defaultOpmerkingen,
    });

    revalidatePath("/secretariaat/locaties", "page");
    revalidatePath(`/secretariaat/locaties/${parsedInput.locationId}`, "page");
    revalidatePath("/secretariaat/instructeur", "page");

    return result;
  });
