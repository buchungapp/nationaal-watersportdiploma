"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  commitBulkImportAsSystemAdmin,
  previewBulkImportAsSystemAdmin,
} from "~/lib/nwd";
import {
  type ParsedPersonRow,
  parseRowsTolerant,
} from "../person/bulk-import-parser";
import {
  countriesSchema,
  csvColumnLiteral,
  csvDataSchema,
} from "../person/person-bulk-csv-mappings";
import { actionClientWithMeta } from "../safe-action";

const previewInputSchema = zfd
  .formData(z.record(csvColumnLiteral, zfd.text()))
  .or(z.void());

const previewArgsSchema: [
  locationId: z.ZodString,
  csvData: typeof csvDataSchema,
  countries: typeof countriesSchema,
] = [z.string().uuid(), csvDataSchema, countriesSchema];

type PreviewParseResult =
  | { kind: "needs-mapping"; columns: string[] }
  | {
      kind: "previewed";
      previewToken: string;
      attempt: 1 | 2 | 3;
      parsedRows: ParsedPersonRow[];
      parseErrors: { rowIndex: number; error: string; values: string[] }[];
      matches: unknown;
    };

export const previewBulkImportInstructorsAsSystemAdminAction =
  actionClientWithMeta
    .metadata({ name: "secretariat.preview-bulk-import-instructors" })
    .inputSchema(previewInputSchema)
    .bindArgsSchemas(previewArgsSchema)
    .action<PreviewParseResult>(
      async ({
        parsedInput: indexToColumnSelection,
        bindArgsParsedInputs: [locationId, csvData, countries],
      }) => {
        if (!indexToColumnSelection) {
          if (!csvData?.rows?.[0]) {
            throw new Error("Geen data gevonden.");
          }
          return {
            kind: "needs-mapping",
            columns: csvData.rows[0],
          };
        }

        const { parsedRows, parseErrors } = parseRowsTolerant(
          csvData,
          indexToColumnSelection as Record<string, string>,
          countries,
        );

        const previewResult = await previewBulkImportAsSystemAdmin({
          locationId,
          roles: ["instructor"],
          csvCandidates: parsedRows.map((row) => ({
            rowIndex: row.rowIndex,
            email: row.email,
            firstName: row.firstName,
            lastNamePrefix: row.lastNamePrefix,
            lastName: row.lastName,
            dateOfBirth: row.dateOfBirth.toISOString().slice(0, 10),
            birthCity: row.birthCity,
            birthCountry: row.birthCountry,
          })),
          parseErrors,
        });

        return {
          kind: "previewed",
          previewToken: previewResult.previewToken,
          attempt: previewResult.attempt as 1 | 2 | 3,
          parsedRows,
          parseErrors,
          matches: previewResult.matches,
        };
      },
    );

const decisionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_new"),
    shareNewPersonWithGroup: z.string().optional(),
  }),
  z.object({ kind: z.literal("use_existing"), personId: z.string().uuid() }),
  z.object({
    kind: z.literal("skip"),
    reason: z
      .enum([
        "cohort_conflict",
        "cross_row_conflict",
        "parse_error",
        "operator",
      ])
      .default("operator"),
  }),
]);

const commitInputSchema = z.object({
  previewToken: z.string().uuid(),
  locationId: z.string().uuid(),
  decisions: z.record(z.string(), decisionSchema),
  candidateInputsByRowIndex: z.record(
    z.string(),
    z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastNamePrefix: z.string().nullable(),
      lastName: z.string(),
      dateOfBirth: z.string(),
      birthCity: z.string(),
      birthCountry: z.string(),
    }),
  ),
});

export const commitBulkImportInstructorsAsSystemAdminAction =
  actionClientWithMeta
    .metadata({ name: "secretariat.commit-bulk-import-instructors" })
    .inputSchema(commitInputSchema)
    .action(async ({ parsedInput }) => {
      const result = await commitBulkImportAsSystemAdmin({
        previewToken: parsedInput.previewToken,
        locationId: parsedInput.locationId,
        roles: ["instructor"],
        decisions: parsedInput.decisions,
        candidateInputsByRowIndex: parsedInput.candidateInputsByRowIndex,
      });

      revalidatePath("/secretariaat/locaties", "page");
      revalidatePath(
        `/secretariaat/locaties/${parsedInput.locationId}`,
        "page",
      );

      return result;
    });
