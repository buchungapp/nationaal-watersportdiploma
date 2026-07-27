"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { commitBulkImport, previewBulkImport } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { type ParsedPersonRow, parseRowsTolerant } from "./bulk-import-parser";
import {
  countriesSchema,
  csvColumnLiteral,
  csvDataSchema,
} from "./person-bulk-csv-mappings";

// ─── Preview ──────────────────────────────────────────────────────────────

const previewInputSchema = zfd
  .formData(z.record(csvColumnLiteral, zfd.text()))
  .or(z.void());

const previewArgsSchema: [
  locationId: z.ZodString,
  roles: z.ZodArray<
    z.ZodEnum<["student", "instructor", "location_admin"]>,
    "atleastone"
  >,
  csvData: typeof csvDataSchema,
  countries: typeof countriesSchema,
  targetCohortId: z.ZodOptional<z.ZodString>,
] = [
  z.string().uuid(),
  z.array(z.enum(["student", "instructor", "location_admin"])).nonempty(),
  csvDataSchema,
  countriesSchema,
  z.string().uuid().optional(),
];

type PreviewParseResult =
  | {
      kind: "needs-mapping";
      columns: string[];
    }
  | {
      kind: "previewed";
      previewToken: string;
      attempt: 1 | 2 | 3;
      parsedRows: ParsedPersonRow[];
      parseErrors: { rowIndex: number; error: string; values: string[] }[];
      matches: unknown;
    };

export const previewBulkImportAction = actionClientWithMeta
  .metadata({ name: "person.preview-bulk-import" })
  .inputSchema(previewInputSchema)
  .bindArgsSchemas(previewArgsSchema)
  .action<PreviewParseResult>(
    async ({
      parsedInput: indexToColumnSelection,
      bindArgsParsedInputs: [
        locationId,
        roles,
        csvData,
        countries,
        targetCohortId,
      ],
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

      const previewResult = await previewBulkImport({
        locationId,
        roles,
        targetCohortId,
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

// ─── Commit ───────────────────────────────────────────────────────────────

const decisionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_new"),
    // Optional grouping key — rows with the same key collapse to ONE
    // newly-created Person at commit time. Used by the cross-row
    // resolver's "same person" + paste-only flow and the override
    // panel's per-row profile buckets.
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
  roles: z
    .array(z.enum(["student", "instructor", "location_admin"]))
    .nonempty(),
  decisions: z.record(z.string(), decisionSchema),
  candidateInputsByRowIndex: z.record(
    z.string(),
    z.object({
      email: z.string().email().nullable(),
      firstName: z.string(),
      lastNamePrefix: z.string().nullable(),
      lastName: z.string(),
      dateOfBirth: z.string(),
      birthCity: z.string(),
      birthCountry: z.string(),
      // Optional cohort-allocation tags applied per row after the
      // allocation insert. Empty / missing → no setAllocationTags call.
      // Capped per row + per tag length to keep operator paste payloads
      // bounded.
      tags: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    }),
  ),
});

export const commitBulkImportAction = actionClientWithMeta
  .metadata({ name: "person.commit-bulk-import" })
  .inputSchema(commitInputSchema)
  .action(async ({ parsedInput }) => {
    // Extract tags from the candidate inputs into a separate map; core
    // commitBulkImport applies them after each cohort_allocation insert.
    const tagsByRowIndex: Record<string, string[]> = {};
    for (const [rowIndex, ci] of Object.entries(
      parsedInput.candidateInputsByRowIndex,
    )) {
      if (ci.tags && ci.tags.length > 0) {
        tagsByRowIndex[rowIndex] = ci.tags;
      }
    }

    const result = await commitBulkImport({
      previewToken: parsedInput.previewToken,
      locationId: parsedInput.locationId,
      roles: parsedInput.roles,
      decisions: parsedInput.decisions,
      candidateInputsByRowIndex: parsedInput.candidateInputsByRowIndex,
      tagsByRowIndex:
        Object.keys(tagsByRowIndex).length > 0 ? tagsByRowIndex : undefined,
    });

    revalidatePath("/locatie/[location]/personen", "page");
    revalidatePath("/locatie/[location]/cohorten", "page");

    return result;
  });
