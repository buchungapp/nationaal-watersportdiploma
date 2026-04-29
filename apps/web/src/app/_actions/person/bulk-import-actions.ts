"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { commitBulkImport, previewBulkImport } from "~/lib/nwd";
import { dateInput } from "../dates";
import { actionClientWithMeta } from "../safe-action";
import {
  COLUMN_MAPPING,
  type CSVData,
  countriesSchema,
  csvColumnLiteral,
  csvDataSchema,
  SELECT_LABEL,
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

const personRowSchema = z
  .tuple([
    z.string().trim().toLowerCase().email(),
    z.string().trim(),
    z
      .string()
      .trim()
      .transform((v) => v || null),
    z.string(),
    dateInput,
    z.string(),
    z
      .preprocess((value) => (value === "" ? "nl" : value), z.string().min(2))
      .default("nl"),
  ])
  .rest(z.string().nullish());

type ParsedPersonRow = {
  rowIndex: number;
  email: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string;
  dateOfBirth: Date;
  birthCity: string;
  birthCountry: string;
};

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

function parseRowsTolerant(
  csvData: CSVData,
  indexToColumnSelection: Record<string, string>,
  countries: z.infer<typeof countriesSchema>,
): {
  parsedRows: ParsedPersonRow[];
  parseErrors: { rowIndex: number; error: string; values: string[] }[];
} {
  if (!csvData || !csvData.rows) {
    throw new Error("Geen data gevonden.");
  }

  const selectedFields = Object.values(indexToColumnSelection).filter(
    (item) => item !== SELECT_LABEL,
  );
  const notSelectedIndices = Object.entries(indexToColumnSelection)
    .filter(([_, value]) => value === SELECT_LABEL)
    // biome-ignore lint/style/noNonNullAssertion: intentional
    .map(([key]) => Number.parseInt(key.split("-").pop()!, 10));

  const filteredData = csvData.rows.map((item) =>
    item.filter((_, index) => !notSelectedIndices.includes(index)),
  );

  const requiredColumns = COLUMN_MAPPING;
  const missingFields = requiredColumns.filter(
    (item) => !selectedFields.includes(item),
  );

  if (missingFields.length > 0) {
    throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
  }

  const indices = selectedFields.map((columnName) =>
    (COLUMN_MAPPING as readonly string[]).indexOf(columnName),
  );

  const allowedCountries = new Set(countries.map((c) => c.code));

  const parsedRows: ParsedPersonRow[] = [];
  const parseErrors: {
    rowIndex: number;
    error: string;
    values: string[];
  }[] = [];

  filteredData.forEach((row, rowIndex) => {
    const sortedRow = indices.map((index) => row[index]);
    const rawValues = sortedRow.map((v) => v ?? "");
    const parsed = personRowSchema.safeParse(sortedRow);
    if (!parsed.success) {
      parseErrors.push({
        rowIndex,
        error: JSON.stringify(parsed.error.flatten().fieldErrors),
        values: rawValues,
      });
      return;
    }
    const [
      email,
      firstName,
      lastNamePrefix,
      lastName,
      dateOfBirth,
      birthCity,
      birthCountry,
    ] = parsed.data;
    if (!allowedCountries.has(birthCountry)) {
      parseErrors.push({
        rowIndex,
        error: `Ongeldige landcode: ${birthCountry}`,
        values: rawValues,
      });
      return;
    }
    parsedRows.push({
      rowIndex,
      email,
      firstName,
      lastNamePrefix,
      lastName,
      dateOfBirth,
      birthCity,
      birthCountry,
    });
  });

  return { parsedRows, parseErrors };
}

// ─── Commit ───────────────────────────────────────────────────────────────

const decisionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("create_new") }),
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

export const commitBulkImportAction = actionClientWithMeta
  .metadata({ name: "person.commit-bulk-import" })
  .inputSchema(commitInputSchema)
  .action(async ({ parsedInput }) => {
    const result = await commitBulkImport({
      previewToken: parsedInput.previewToken,
      locationId: parsedInput.locationId,
      roles: parsedInput.roles,
      decisions: parsedInput.decisions,
      candidateInputsByRowIndex: parsedInput.candidateInputsByRowIndex,
    });

    revalidatePath("/locatie/[location]/personen", "page");
    revalidatePath("/locatie/[location]/cohorten", "page");

    return result;
  });
