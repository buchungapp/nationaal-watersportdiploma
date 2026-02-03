import {
  Certificate,
  Location,
  useQuery,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { schema } from "@nawadi/db";
import csv from "csvtojson";
import "dotenv/config";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { and, eq, exists, isNull, sql } from "drizzle-orm";
import inquirer from "inquirer";
import { chunk } from "lodash-es";
import pThrottle from "p-throttle";
import { z } from "zod";

const BATCH_SIZE = 100;
const OPERATIONS_PER_SECOND = 10;

// Cache for person lookups to avoid redundant database queries
const personCache = new Map<string, string | null>();

// Add a new type to track rows that need user interaction
interface InteractiveRow {
  row: z.infer<typeof rowSchema>;
  rowIndex: number;
  persons: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    lastNamePrefix: string | null;
    dateOfBirth: string | null;
    birthCity: string | null;
    handle: string | null;
  }>;
}

const throttledProcess = pThrottle({
  interval: 1000,
  limit: OPERATIONS_PER_SECOND,
})((row: z.infer<typeof rowSchema>, locationId: string, rowIndex?: number) =>
  processRowAutomated(row, locationId, rowIndex),
);

// Helper function to create a cache key for person lookup
function createPersonCacheKey(
  firstName: string,
  lastName: string,
  lastNamePrefix: string | null,
  dateOfBirth: string | null,
  birthCity: string | null,
  locationId: string,
): string {
  return `${firstName}|${lastName}|${lastNamePrefix || ""}|${dateOfBirth}|${birthCity}|${locationId}`;
}

// Cache statistics tracking
let cacheHits = 0;
let cacheMisses = 0;

// Track skipped rows for reporting
interface SkippedRow {
  rowIndex: number;
  reason: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const skippedRows: SkippedRow[] = [];

function addSkippedRow(
  rowIndex: number,
  reason: string,
  data: Record<string, unknown>,
) {
  skippedRows.push({
    rowIndex,
    reason,
    data,
    timestamp: new Date().toISOString(),
  });
}

async function writeSkippedRowsReport(filePath: string) {
  if (skippedRows.length === 0) {
    console.log("No skipped rows to report.");
    return;
  }

  const reportPath = path.join(
    path.dirname(filePath),
    `skipped-rows-${Date.now()}.txt`,
  );

  let reportContent = `SKIPPED ROWS REPORT
Generated: ${new Date().toISOString()}
Source file: ${path.basename(filePath)}
Total skipped rows: ${skippedRows.length}

`;

  // Group by reason for better analysis
  const groupedByReason = new Map<string, SkippedRow[]>();
  for (const row of skippedRows) {
    if (!groupedByReason.has(row.reason)) {
      groupedByReason.set(row.reason, []);
    }
    const rows = groupedByReason.get(row.reason);
    if (rows) {
      rows.push(row);
    }
  }

  // Write summary
  reportContent += "SUMMARY BY REASON:\n";
  reportContent += "==================\n";
  for (const [reason, rows] of groupedByReason) {
    reportContent += `${reason}: ${rows.length} rows\n`;
  }

  reportContent += "\n\nDETAILED REPORT:\n";
  reportContent += "================\n";

  // Write detailed report
  for (const row of skippedRows) {
    reportContent += `Row ${row.rowIndex} (${row.timestamp}):\n`;
    reportContent += `Reason: ${row.reason}\n`;
    reportContent += `Data: ${JSON.stringify(row.data, null, 2)}\n`;
    reportContent += "---\n\n";
  }

  try {
    fs.writeFileSync(reportPath, reportContent, "utf8");
    console.log(`📄 Skipped rows report written to: ${reportPath}`);
  } catch (error) {
    console.error("Error writing skipped rows report:", error);
  }
}

function reportCacheStats() {
  const totalLookups = cacheHits + cacheMisses;
  const hitRate =
    totalLookups > 0 ? ((cacheHits / totalLookups) * 100).toFixed(2) : "0.00";

  console.log("\n--- Person Lookup Cache Statistics ---");
  console.log(`Total lookups: ${totalLookups}`);
  console.log(`Cache hits: ${cacheHits}`);
  console.log(`Cache misses: ${cacheMisses}`);
  console.log(`Hit rate: ${hitRate}%`);
  console.log(`Unique persons in cache: ${personCache.size}`);
  console.log("----------------------------------------\n");
}

const rowSchema = z.object({
  Voornaam: z.string().trim().nullable(),
  Tussenvoegsel: z.string().trim().nullable(),
  Achternaam: z.string().trim().nullable(),
  "E-mail": z.string().trim().toLowerCase().email().nullable(),
  Geboorteplaats: z.string().trim().nullable(),
  Geboortedatum: z
    .string()
    .nullish()
    .transform((val, ctx) => {
      if (!val) {
        return null;
      }

      // Split the date string into components
      const [day, month, year] = val.split("-").map(Number);

      if (!day || !month || !year) {
        ctx.addIssue({
          code: "invalid_date",
          message: "Invalid date format",
        });
        return z.NEVER;
      }

      // Create a date in UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month - 1, day));

      // Check if the date is valid
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: "invalid_date",
          message: "Invalid date",
        });
        return z.NEVER;
      }

      // Return just the date part (YYYY-MM-DD) to avoid time/timezone issues
      const dateStr = date.toISOString().split("T")[0];

      return dateStr;
    }),
  "Kwalificatie: Naam van Kwalificatie": z.enum([
    "Eigen vaardigheid - Catamaran",
    "Eigen vaardigheid - Jachtzeilen Non Tidal",
    "Eigen vaardigheid - Jachtzeilen Tidal",
    "Eigen vaardigheid - Kajuitzeilen",
    "Eigen vaardigheid - Kielboot",
    "Eigen vaardigheid - Windsurfen",
    "Eigen vaardigheid - Zwaardboot eenmans",
    "Eigen vaardigheid - Zwaardboot tweemans",
    "Eigen vaardigheid - Jachtvaren Zeil non-tidal",
    "Eigen vaardigheid - Zeezeilen",
    "Instructeur - Buitenboordmotor",
    "Instructeur - Catamaran",
    "Instructeur - Groot Motorschip",
    "Instructeur - Jachtzeilen non-tidal",
    "Instructeur - Jachtzeilen Tidal",
    "Instructeur - Jeugdcatamaran",
    "Instructeur - Jeugdkielboot",
    "Instructeur - Jeugdzeilen",
    "Instructeur - Kajuitzeilen",
    "Instructeur - Kielboot",
    "Instructeur - Sloep- en Motorvlet",
    "Instructeur - Windsurfen Fun",
    "Instructeur - Windsurfen",
    "Instructeur - Zwaardboot eenmans",
    "Instructeur - Zwaardboot tweemans",
    "Instructeur - Motorboot",
    "Instructeur - Roeien",
    "Instructeur - Zeezeilen",
  ]),
  "Hoogste Geldigheids Niveau": z.enum([
    "2",
    "3",
    "4",
    "4*",
    "5*",
    "5",
    "I-2",
    "IV",
    "IV+",
  ]),
});

const qualificationToCourseIdsMap: Record<
  z.infer<typeof rowSchema>["Kwalificatie: Naam van Kwalificatie"],
  | {
      _type: "kss";
      courseIds: string[];
    }
  | {
      _type: "eigenvaardigheid";
      discipline:
        | "Zwaardboot eenmans"
        | "Zwaardboot tweemans"
        | "Catamaran"
        | "Windsurfen"
        | "Kielboot"
        | "Jachtzeilen Non Tidal"
        | "Jachtzeilen Tidal"
        | "Kajuitzeilen";
    }
> = {
  "Eigen vaardigheid - Catamaran": {
    _type: "eigenvaardigheid",
    discipline: "Catamaran",
  },
  "Eigen vaardigheid - Jachtzeilen Non Tidal": {
    _type: "eigenvaardigheid",
    discipline: "Jachtzeilen Non Tidal",
  },
  "Eigen vaardigheid - Jachtzeilen Tidal": {
    _type: "eigenvaardigheid",
    discipline: "Jachtzeilen Tidal",
  },
  "Eigen vaardigheid - Kajuitzeilen": {
    _type: "eigenvaardigheid",
    discipline: "Kajuitzeilen",
  },
  "Eigen vaardigheid - Kielboot": {
    _type: "eigenvaardigheid",
    discipline: "Kielboot",
  },
  "Eigen vaardigheid - Windsurfen": {
    _type: "eigenvaardigheid",
    discipline: "Windsurfen",
  },
  "Eigen vaardigheid - Zwaardboot eenmans": {
    _type: "eigenvaardigheid",
    discipline: "Zwaardboot eenmans",
  },
  "Eigen vaardigheid - Zwaardboot tweemans": {
    _type: "eigenvaardigheid",
    discipline: "Zwaardboot tweemans",
  },
  "Eigen vaardigheid - Jachtvaren Zeil non-tidal": {
    _type: "eigenvaardigheid",
    discipline: "Jachtzeilen Non Tidal",
  },
  "Eigen vaardigheid - Zeezeilen": {
    _type: "eigenvaardigheid",
    discipline: "Jachtzeilen Tidal",
  },
  "Instructeur - Buitenboordmotor": {
    _type: "kss",
    courseIds: [],
  },
  "Instructeur - Catamaran": {
    _type: "kss",
    courseIds: ["0ea93de5-7cf7-4007-b35c-aa3237a7cc11"],
  },
  "Instructeur - Groot Motorschip": {
    _type: "kss",
    courseIds: [],
  },
  "Instructeur - Jachtzeilen non-tidal": {
    _type: "kss",
    courseIds: [
      "4dffe11b-aec5-41fc-9a64-820fcdcf84af",
      "205abe69-7e72-4410-9938-c05f03eba308",
    ],
  },
  "Instructeur - Jachtzeilen Tidal": {
    _type: "kss",
    courseIds: [
      "7d23de6f-b80e-4a79-a661-1e7bd8123a20",
      "701de205-512a-40ad-a74d-87dded31d038",
    ],
  },
  "Instructeur - Jeugdcatamaran": {
    _type: "kss",
    courseIds: [
      "d9ffa419-c23a-49b0-a150-61aaa32e2771",
      "7308ee2b-4d0c-41d5-9348-56f9618de63a",
    ],
  },
  "Instructeur - Jeugdkielboot": {
    _type: "kss",
    courseIds: [
      "917aff39-370d-46d9-b2b4-cd1cec0a8528",
      "eb7eb894-f574-4ef0-92a9-aaf268f4a76c",
    ],
  },
  "Instructeur - Jeugdzeilen": {
    _type: "kss",
    courseIds: [
      "3b58756d-6600-4374-827b-c2e171670681",
      "f85a5bd4-21db-498b-9427-1d3d7cb863c0",
      "ff45c468-264d-45c9-a74a-fe468c53572a",
      "b079fa07-feee-4499-b383-50cb7177a939",
    ],
  },
  "Instructeur - Kajuitzeilen": {
    _type: "kss",
    courseIds: [
      "4dffe11b-aec5-41fc-9a64-820fcdcf84af",
      "205abe69-7e72-4410-9938-c05f03eba308",
    ],
  },
  "Instructeur - Kielboot": {
    _type: "kss",
    courseIds: ["5d052315-665d-42ce-baa0-246576661dca"],
  },
  "Instructeur - Sloep- en Motorvlet": {
    _type: "kss",
    courseIds: [],
  },
  "Instructeur - Windsurfen Fun": {
    _type: "kss",
    courseIds: ["5cb191b2-aac4-482e-8a60-f9902dc24d44"],
  },
  "Instructeur - Windsurfen": {
    _type: "kss",
    courseIds: ["5cb191b2-aac4-482e-8a60-f9902dc24d44"],
  },
  "Instructeur - Zwaardboot eenmans": {
    _type: "kss",
    courseIds: ["700c1b8c-c6a3-4f09-93d0-1b8a3ba4baa3"],
  },
  "Instructeur - Zwaardboot tweemans": {
    _type: "kss",
    courseIds: ["eb472ee4-08c9-4036-b6b6-d0395fddde43"],
  },
  "Instructeur - Motorboot": {
    _type: "kss",
    courseIds: [],
  },
  "Instructeur - Roeien": {
    _type: "kss",
    courseIds: [],
  },
  "Instructeur - Zeezeilen": {
    _type: "kss",
    courseIds: [
      "7d23de6f-b80e-4a79-a661-1e7bd8123a20",
      "701de205-512a-40ad-a74d-87dded31d038",
    ],
  },
};

const degreeToKssIdsMap: Record<
  // cSpell:ignore Geldigheids
  z.infer<typeof rowSchema>["Hoogste Geldigheids Niveau"],
  string[] | null
> = {
  "2": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
  ],
  "I-2": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
  ],
  "3": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
    "1eedd811-afc9-4d2f-9ee0-fbc29fef705a",
    "256fbc15-5094-4f64-a03a-a9f0025a1ca3",
    "467c3f5d-13d2-4e52-b37d-23d3f4d3a3af",
    "8ce62770-17b0-4c82-aa4f-73d544a54389",
  ],
  "4": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
    "1eedd811-afc9-4d2f-9ee0-fbc29fef705a",
    "256fbc15-5094-4f64-a03a-a9f0025a1ca3",
    "467c3f5d-13d2-4e52-b37d-23d3f4d3a3af",
    "8ce62770-17b0-4c82-aa4f-73d544a54389",
    "9f452308-409c-4ceb-a51d-150a47b16d91",
    "6ed32341-9a1a-46c9-9e00-e4d297768a61",
    "d46ebf91-a6fd-4e9c-b771-450e5321263a",
    "47426de1-9fc0-4793-bdf1-b2ad838edbbb",
    "618f1248-3f6a-4cd4-b69a-66e419e38759",
    "c9048d27-b2de-44ca-a776-9cef69c6d7bb",
    "5c8993ba-b913-42ef-8dd9-3db917fca7f9",
  ],
  "4*": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
    "1eedd811-afc9-4d2f-9ee0-fbc29fef705a",
    "256fbc15-5094-4f64-a03a-a9f0025a1ca3",
    "467c3f5d-13d2-4e52-b37d-23d3f4d3a3af",
    "8ce62770-17b0-4c82-aa4f-73d544a54389",
    "9f452308-409c-4ceb-a51d-150a47b16d91",
    "6ed32341-9a1a-46c9-9e00-e4d297768a61",
    "d46ebf91-a6fd-4e9c-b771-450e5321263a",
    "47426de1-9fc0-4793-bdf1-b2ad838edbbb",
    "618f1248-3f6a-4cd4-b69a-66e419e38759",
    "c9048d27-b2de-44ca-a776-9cef69c6d7bb",
    "5c8993ba-b913-42ef-8dd9-3db917fca7f9",
  ],
  "5": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
    "1eedd811-afc9-4d2f-9ee0-fbc29fef705a",
    "256fbc15-5094-4f64-a03a-a9f0025a1ca3",
    "467c3f5d-13d2-4e52-b37d-23d3f4d3a3af",
    "8ce62770-17b0-4c82-aa4f-73d544a54389",
    "9f452308-409c-4ceb-a51d-150a47b16d91",
    "6ed32341-9a1a-46c9-9e00-e4d297768a61",
    "d46ebf91-a6fd-4e9c-b771-450e5321263a",
    "47426de1-9fc0-4793-bdf1-b2ad838edbbb",
    "618f1248-3f6a-4cd4-b69a-66e419e38759",
    "c9048d27-b2de-44ca-a776-9cef69c6d7bb",
    "5c8993ba-b913-42ef-8dd9-3db917fca7f9",
    "3e9d59c2-b4a6-4bb1-ad9d-4ebcb1a7d7d6",
    "680328ab-b283-472e-a571-03f45f996179",
    "00e53941-3d60-4d80-acd8-4013ac2986cf",
    "c8ef83e4-6461-4273-9991-1975632b1b40",
    "4657c45a-8e1d-41f9-942d-38f0e95187cc",
    "65e99d50-970e-4ee3-975c-63dac5742cdb",
    "7fc9247b-caa6-4889-b64b-b4394e293506",
  ],
  "5*": [
    "1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0",
    "f05aacbe-4206-40c7-99f6-a8a10a48da7d",
    "1eedd811-afc9-4d2f-9ee0-fbc29fef705a",
    "256fbc15-5094-4f64-a03a-a9f0025a1ca3",
    "467c3f5d-13d2-4e52-b37d-23d3f4d3a3af",
    "8ce62770-17b0-4c82-aa4f-73d544a54389",
    "9f452308-409c-4ceb-a51d-150a47b16d91",
    "6ed32341-9a1a-46c9-9e00-e4d297768a61",
    "d46ebf91-a6fd-4e9c-b771-450e5321263a",
    "47426de1-9fc0-4793-bdf1-b2ad838edbbb",
    "618f1248-3f6a-4cd4-b69a-66e419e38759",
    "c9048d27-b2de-44ca-a776-9cef69c6d7bb",
    "5c8993ba-b913-42ef-8dd9-3db917fca7f9",
    "3e9d59c2-b4a6-4bb1-ad9d-4ebcb1a7d7d6",
    "680328ab-b283-472e-a571-03f45f996179",
    "00e53941-3d60-4d80-acd8-4013ac2986cf",
    "c8ef83e4-6461-4273-9991-1975632b1b40",
    "4657c45a-8e1d-41f9-942d-38f0e95187cc",
    "65e99d50-970e-4ee3-975c-63dac5742cdb",
    "7fc9247b-caa6-4889-b64b-b4394e293506",
  ],
  IV: null,
  "IV+": null,
};

async function parseCsv(filePath: string) {
  try {
    const csvFilePath = path.resolve(filePath);
    const jsonArray = await csv({ delimiter: [",", ";"] }).fromFile(
      csvFilePath,
    );

    return jsonArray ?? [];
  } catch (error) {
    console.error("Error reading the CSV file:", error);
    throw error;
  }
}

async function validateAndParseRows(csvRows: Record<string, unknown>[]) {
  console.log(`Total rows to validate: ${csvRows.length}`);

  // Clean the rows first
  const cleanedRows = csvRows
    .filter((row) => {
      // At least one value is required
      return Object.values(row).some((value) => value !== "");
    })
    .map((row) => {
      // Set all empty strings to null
      for (const key in row) {
        if (row[key] === "") {
          row[key] = null;
        }
      }
      return row;
    });

  console.log(`Rows after cleaning: ${cleanedRows.length}`);

  // Validate all rows and collect errors
  const validationResults = cleanedRows.map((row, index) => ({
    row,
    index: index + 1, // 1-based indexing for user display
    result: rowSchema.safeParse(row),
  }));

  // Separate valid and invalid rows
  const validRows: z.infer<typeof rowSchema>[] = validationResults
    .filter((item) => item.result.success)
    .map((item) => item.result.data as z.infer<typeof rowSchema>);

  const invalidRows = validationResults.filter((item) => !item.result.success);

  // Report validation summary
  console.log(`✅ Valid rows: ${validRows.length}`);
  console.log(`❌ Invalid rows: ${invalidRows.length}`);

  // Show detailed errors for invalid rows
  if (invalidRows.length > 0) {
    console.log("\n--- Validation Errors ---");

    // Group errors by type for summary
    const errorSummary = new Map<string, number>();

    for (const { index, result, row } of invalidRows) {
      console.log(`\nRow ${index}:`);
      console.log(`Raw data: ${JSON.stringify(row, null, 2)}`);

      if (!result.success) {
        for (const error of result.error.errors) {
          const fieldPath =
            error.path.length > 0 ? error.path.join(".") : "root";
          const errorKey = `${fieldPath}: ${error.message}`;

          console.log(`  ❌ Field "${fieldPath}": ${error.message}`);
          if (error.code === "invalid_type") {
            console.log(
              `     Expected: ${error.expected}, Received: ${error.received}`,
            );
          }

          // Track error frequency
          errorSummary.set(errorKey, (errorSummary.get(errorKey) || 0) + 1);

          // Add to skipped rows for reporting
          addSkippedRow(
            index,
            `Validation error: ${fieldPath} - ${error.message}`,
            row,
          );
        }
      }
    }

    // Show error summary
    console.log("\n--- Error Summary ---");
    const sortedErrors = Array.from(errorSummary.entries()).sort(
      (a, b) => b[1] - a[1],
    ); // Sort by frequency, most common first

    for (const [error, count] of sortedErrors) {
      console.log(`${count}x: ${error}`);
    }

    console.log("------------------------\n");
  }

  return {
    validRows,
    invalidRows,
    totalRows: csvRows.length,
    cleanedRows: cleanedRows.length,
  };
}

async function processRows(
  rows: z.infer<typeof rowSchema>[],
  locationId: string,
) {
  console.log("\n=== ANALYZING ROWS ===");
  console.log("Checking which rows need user interaction...");

  // First, identify which rows need user interaction
  const interactiveRows: InteractiveRow[] = [];
  const automatedRows: Array<{
    row: z.infer<typeof rowSchema>;
    rowIndex: number;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue; // Skip undefined rows
    const rowIndex = i + 1;

    if (!row.Voornaam || !row.Achternaam) {
      // Skip rows with missing names
      addSkippedRow(rowIndex, "Missing first name or last name", row);
      continue;
    }

    // Check if this row needs user interaction
    const checkResult = await checkIfNeedsUserInteraction(
      row,
      locationId,
      rowIndex,
    );

    if (checkResult.needsInteraction) {
      interactiveRows.push({
        row,
        rowIndex,
        persons: checkResult.persons || [],
      });
    } else if (checkResult.skip) {
      // Already added to skipped rows in the check function
    } else {
      automatedRows.push({ row, rowIndex });
    }
  }

  console.log("\n📊 Row Analysis Complete:");
  console.log(`  - Automated processing: ${automatedRows.length} rows`);
  console.log(`  - User interaction needed: ${interactiveRows.length} rows`);
  console.log(`  - Skipped: ${skippedRows.length} rows`);

  // Process automated rows in parallel batches
  if (automatedRows.length > 0) {
    console.log("\n=== AUTOMATED PROCESSING ===");
    console.log(`Processing ${automatedRows.length} rows automatically...`);

    const batches = chunk(automatedRows, BATCH_SIZE);
    let batchIndex = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

    for (const batch of batches) {
      batchIndex++;
      console.log(`Processing batch ${batchIndex} of ${batches.length} ...`);

      const result = await Promise.allSettled(
        batch.map((item) =>
          throttledProcess(item.row, locationId, item.rowIndex),
        ),
      );

      const errors = result.filter((r) => r.status === "rejected");
      const successes = result.filter((r) => r.status === "fulfilled");

      console.log(`Batch processed: ${result.length} items`);
      console.log(`✅ Successful: ${successes.length}`);
      console.log(`❌ Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log("\n--- Batch Error Details ---");
        errors.forEach((error, errorIndex) => {
          const item = batch[errorIndex];
          if (item) {
            console.error(`Error in row ${item.rowIndex}:`);
            console.error(
              `  Message: ${error.reason instanceof Error ? error.reason.message : String(error.reason)}`,
            );
          }
        });
        console.log("--- End Batch Error Details ---\n");
      }

      totalErrors += errors.length;
      totalProcessed += successes.length;
    }

    console.log(
      `\n✅ Automated processing complete: ${totalProcessed} successful, ${totalErrors} errors`,
    );
  }

  // Process interactive rows sequentially
  if (interactiveRows.length > 0) {
    console.log("\n=== INTERACTIVE PROCESSING ===");
    console.log(
      `Processing ${interactiveRows.length} rows that need user interaction...`,
    );
    console.log(
      "These will be processed one at a time to avoid console interference.\n",
    );

    for (const interactiveRow of interactiveRows) {
      console.log(`\n--- Processing Row ${interactiveRow.rowIndex} ---`);
      try {
        await processInteractiveRow(interactiveRow, locationId);
      } catch (error) {
        console.error(
          `Error processing row ${interactiveRow.rowIndex}:`,
          error,
        );
      }
    }
  }

  console.log("\n=== FINAL SUMMARY ===");
  console.log(
    `✅ Total processed successfully: ${rows.length - skippedRows.length}`,
  );
  console.log(`❌ Total skipped: ${skippedRows.length}`);
  console.log(`📊 Total rows attempted: ${rows.length}`);
  console.log("====================\n");

  // Report cache statistics after processing all rows
  reportCacheStats();
}

async function checkIfNeedsUserInteraction(
  row: z.infer<typeof rowSchema>,
  locationId: string,
  rowIndex: number,
): Promise<{
  needsInteraction: boolean;
  skip: boolean;
  persons?: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    lastNamePrefix: string | null;
    dateOfBirth: string | null;
    birthCity: string | null;
    handle: string | null;
  }>;
}> {
  const db = useQuery();

  // Create cache key for person lookup
  const cacheKey = createPersonCacheKey(
    row.Voornaam as string,
    row.Achternaam as string,
    row.Tussenvoegsel,
    row.Geboortedatum ?? null,
    row.Geboorteplaats,
    locationId,
  );

  // Check cache first
  const cachedPersonId = personCache.get(cacheKey);
  if (cachedPersonId !== undefined) {
    // Already in cache
    if (cachedPersonId === null) {
      // Cached failed lookup - need to add to skipped rows
      addSkippedRow(rowIndex, "No person found (cached)", row);
    }
    return { needsInteraction: false, skip: cachedPersonId === null };
  }

  // Not in cache, perform database query
  const persons = await db
    .select({
      id: schema.person.id,
      firstName: schema.person.firstName,
      lastName: schema.person.lastName,
      lastNamePrefix: schema.person.lastNamePrefix,
      dateOfBirth: schema.person.dateOfBirth,
      birthCity: schema.person.birthCity,
      handle: schema.person.handle,
    })
    .from(schema.person)
    .where(
      and(
        eq(schema.person.firstName, row.Voornaam as string),
        eq(schema.person.lastName, row.Achternaam as string),
        row.Tussenvoegsel
          ? eq(schema.person.lastNamePrefix, row.Tussenvoegsel)
          : isNull(schema.person.lastNamePrefix),
        row.Geboortedatum
          ? eq(schema.person.dateOfBirth, row.Geboortedatum)
          : undefined,
        row.Geboorteplaats
          ? eq(schema.person.birthCity, row.Geboorteplaats)
          : undefined,
        exists(
          db
            .select({ id: sql`1` })
            .from(schema.actor)
            .where(
              and(
                eq(schema.actor.personId, schema.person.id),
                eq(schema.actor.locationId, locationId),
                eq(schema.actor.type, "instructor"),
              ),
            ),
        ),
      ),
    );

  if (persons.length === 0) {
    // No person found, skip this row
    personCache.set(cacheKey, null);
    addSkippedRow(rowIndex, "No person found", row);
    return { needsInteraction: false, skip: true };
  }

  if (persons.length === 1) {
    // Exactly one person found, cache it
    const firstPerson = persons[0];
    if (firstPerson) {
      personCache.set(cacheKey, firstPerson.id);
    }
    return { needsInteraction: false, skip: false };
  }

  // Multiple persons found, needs user interaction
  return { needsInteraction: true, skip: false, persons };
}

async function processInteractiveRow(
  interactiveRow: InteractiveRow,
  locationId: string,
) {
  const { row, rowIndex, persons } = interactiveRow;

  const fullName = [row.Voornaam, row.Tussenvoegsel, row.Achternaam]
    .filter(Boolean)
    .join(" ");

  console.log(`\n🤔 Multiple persons found for row ${rowIndex}:`);
  console.log(`Name: ${fullName}`);
  console.log(`Date of Birth: ${row.Geboortedatum || "Not provided"}`);
  console.log(`Birth City: ${row.Geboorteplaats || "Not provided"}`);
  console.log(`Qualification: ${row["Kwalificatie: Naam van Kwalificatie"]}`);
  console.log(`Level: ${row["Hoogste Geldigheids Niveau"]}`);

  const { selectedPersonId } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedPersonId",
      message: `Which person matches row ${rowIndex}?`,
      choices: [
        ...persons.map((person) => ({
          name: `${person.firstName} ${person.lastNamePrefix || ""} ${person.lastName || ""} | DOB: ${person.dateOfBirth || "Unknown"} | City: ${person.birthCity || "Unknown"} | Handle: ${person.handle || "Unknown"}`.trim(),
          value: person.id,
        })),
        {
          name: "❌ Skip this row (none of the above match)",
          value: null,
        },
      ],
    },
  ]);

  if (selectedPersonId === null) {
    // User chose to skip this row
    const cacheKey = createPersonCacheKey(
      row.Voornaam as string,
      row.Achternaam as string,
      row.Tussenvoegsel,
      row.Geboortedatum ?? null,
      row.Geboorteplaats,
      locationId,
    );
    personCache.set(cacheKey, null);
    console.log(`Row ${rowIndex} skipped as requested by user`);
    addSkippedRow(rowIndex, "User chose to skip", row);
    return;
  }

  // Store the user's selection in cache
  const cacheKey = createPersonCacheKey(
    row.Voornaam as string,
    row.Achternaam as string,
    row.Tussenvoegsel,
    row.Geboortedatum ?? null,
    row.Geboorteplaats,
    locationId,
  );
  personCache.set(cacheKey, selectedPersonId);

  // Now process the row with the selected person ID
  await processRowWithPersonId(row, selectedPersonId, rowIndex);
}

async function processRowAutomated(
  row: z.infer<typeof rowSchema>,
  locationId: string,
  rowIndex?: number,
) {
  const rowInfo = rowIndex ? `Row ${rowIndex}: ` : "";

  if (!row.Voornaam || !row.Achternaam) {
    console.error(
      `${rowInfo}Skipping row, missing first name or last name:`,
      row,
    );
    addSkippedRow(rowIndex || 0, "Missing first name or last name", row);
    return;
  }

  const db = useQuery();

  // Create cache key for person lookup
  const cacheKey = createPersonCacheKey(
    row.Voornaam,
    row.Achternaam,
    row.Tussenvoegsel,
    row.Geboortedatum ?? null,
    row.Geboorteplaats,
    locationId,
  );

  // Check cache first
  let personId = personCache.get(cacheKey);

  if (personId === undefined) {
    // Not in cache, perform database query
    cacheMisses++;
    const persons = await db
      .select({ id: schema.person.id })
      .from(schema.person)
      .where(
        and(
          eq(schema.person.firstName, row.Voornaam),
          eq(schema.person.lastName, row.Achternaam),
          row.Tussenvoegsel
            ? eq(schema.person.lastNamePrefix, row.Tussenvoegsel)
            : isNull(schema.person.lastNamePrefix),
          row.Geboortedatum
            ? eq(schema.person.dateOfBirth, row.Geboortedatum)
            : undefined,
          row.Geboorteplaats
            ? eq(schema.person.birthCity, row.Geboorteplaats)
            : undefined,
          exists(
            db
              .select({ id: sql`1` })
              .from(schema.actor)
              .where(
                and(
                  eq(schema.actor.personId, schema.person.id),
                  eq(schema.actor.locationId, locationId),
                  eq(schema.actor.type, "instructor"),
                ),
              ),
          ),
        ),
      );

    if (persons.length === 0) {
      // Store null in cache to avoid repeated failed lookups
      personCache.set(cacheKey, null);
      console.error(`${rowInfo}Skipping row, no person found:`, row);
      addSkippedRow(rowIndex || 0, "No person found", row);
      return;
    }

    if (persons.length > 1) {
      // This shouldn't happen in automated processing
      // The checkIfNeedsUserInteraction should have caught this
      console.error(
        `${rowInfo}Unexpected: Multiple persons found in automated processing`,
      );
      addSkippedRow(rowIndex || 0, "Multiple persons found unexpectedly", row);
      return;
    }

    // We know there is only one person
    const firstPerson = persons[0];
    if (!firstPerson) {
      console.error(`${rowInfo}Unexpected: No person in array`);
      addSkippedRow(rowIndex || 0, "No person in array", row);
      return;
    }
    personId = firstPerson.id;
    // Store successful result in cache
    personCache.set(cacheKey, personId);
  } else if (personId === null) {
    // Cache hit with null value (previous failed lookup)
    cacheHits++;
    console.error(`${rowInfo}Skipping row, cached failed lookup:`, row);
    addSkippedRow(rowIndex || 0, "No person found (cached)", row);
    return;
  } else {
    // Cache hit with valid person ID
    cacheHits++;
  }

  // Process the row with the found person ID
  await processRowWithPersonId(row, personId, rowIndex || 0);
}

async function processRowWithPersonId(
  row: z.infer<typeof rowSchema>,
  personId: string,
  _rowIndex: number,
) {
  const qualification = {
    name: row["Kwalificatie: Naam van Kwalificatie"],
    level: row["Hoogste Geldigheids Niveau"],
  };

  const qualificationToCourseIds =
    qualificationToCourseIdsMap[qualification.name];

  const isKssType = (
    a: typeof qualificationToCourseIds,
  ): a is {
    _type: "kss";
    courseIds: string[];
  } => a._type === "kss";

  if (!isKssType(qualificationToCourseIds)) {
    const externalCertificateName = `${qualification.name} (${qualification.level})`;

    // First check a external certificate with the same title already exists
    const existing = await useQuery()
      .select()
      .from(schema.externalCertificate)
      .where(
        and(
          eq(schema.externalCertificate.title, externalCertificateName),
          eq(schema.externalCertificate.personId, personId),
          eq(
            sql`${schema.externalCertificate._metadata}->>'__verified'`,
            "true",
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(
        `External certificate with title ${qualification.name} (${qualification.level}) already exists for person ${personId}`,
      );
      return;
    }

    await Certificate.External.create({
      personId,
      title: externalCertificateName,
      additionalComments: null,
      awardedAt: null,
      identifier: null,
      issuingAuthority: "CWO",
      issuingLocation: null,
      mediaId: null,
      metadata: {
        __verified: true,
        level: qualification.level,
        discipline: qualification.name,
      },
    });

    return;
  }

  const degreeToKssIds = degreeToKssIdsMap[qualification.level];

  if (!degreeToKssIds) {
    throw new Error("No KSS IDs found for qualification level");
  }

  const valuesToInsert: (typeof schema.persoonKwalificatie.$inferInsert)[] =
    qualificationToCourseIds.courseIds.flatMap((courseId) => {
      return degreeToKssIds.map((kssId) => {
        return {
          directBehaaldePvbOnderdeelId: null,
          afgeleidePvbOnderdeelId: null,
          courseId: courseId,
          personId: personId,
          kerntaakOnderdeelId: kssId,
          verkregenReden: "onbekend",
          toegevoegdOp: new Date("2024-01-01").toISOString(),
          toegevoegdDoor: null,
          opmerkingen:
            "Op basis van SalesForce export Commissie Watersport Opleidingen (CWO)",
        };
      });
    });

  if (valuesToInsert.length > 0) {
    const db = useQuery();
    await db
      .insert(schema.persoonKwalificatie)
      .values(valuesToInsert)
      .onConflictDoNothing();
  }
}

async function reprocessSkippedPersons(
  skippedRows: SkippedRow[],
  locationId: string,
) {
  // Filter for "No person found" rows (including cached)
  const noPersonFoundRows = skippedRows.filter(
    (row) =>
      row.reason === "No person found" ||
      row.reason === "No person found (cached)",
  );

  if (noPersonFoundRows.length === 0) {
    console.log("No rows with 'No person found' reason to reprocess.");
    return;
  }

  console.log("\n=== REPROCESSING SKIPPED ROWS ===");
  console.log(
    `Found ${noPersonFoundRows.length} rows with 'No person found' to reprocess.`,
  );

  const { shouldReprocess } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldReprocess",
      message: "Would you like to manually process these rows?",
      default: true,
    },
  ]);

  if (!shouldReprocess) {
    console.log("Skipping reprocessing.");
    return;
  }

  let processedCount = 0;
  let skippedCount = 0;
  const processedIndices = new Set<number>();

  for (const skippedRow of noPersonFoundRows) {
    // Skip if already processed as part of a batch
    if (processedIndices.has(skippedRow.rowIndex)) {
      continue;
    }

    const row = skippedRow.data as z.infer<typeof rowSchema>;
    const fullName = [row.Voornaam, row.Tussenvoegsel, row.Achternaam]
      .filter(Boolean)
      .join(" ");

    console.log(`\n--- Row ${skippedRow.rowIndex} ---`);
    console.log(`Name: ${fullName}`);
    console.log(`Date of Birth: ${row.Geboortedatum || "Not provided"}`);
    console.log(`Birth City: ${row.Geboorteplaats || "Not provided"}`);
    console.log(`Qualification: ${row["Kwalificatie: Naam van Kwalificatie"]}`);
    console.log(`Level: ${row["Hoogste Geldigheids Niveau"]}`);

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do with this row?",
        choices: [
          { name: "Enter person handle manually", value: "manual" },
          { name: "Search by name (ignore other fields)", value: "search" },
          { name: "Skip this row", value: "skip" },
        ],
      },
    ]);

    if (action === "skip") {
      console.log("Row skipped.");
      skippedCount++;
      processedIndices.add(skippedRow.rowIndex);
      continue;
    }

    let personId: string | null = null;

    if (action === "manual") {
      const { handle } = await inquirer.prompt([
        {
          type: "input",
          name: "handle",
          message: "Enter the person's handle:",
          validate: (input) =>
            input.trim().length > 0 || "Handle cannot be empty",
        },
      ]);

      // Look up person by handle
      const db = useQuery();
      const persons = await db
        .select({
          id: schema.person.id,
          firstName: schema.person.firstName,
          lastName: schema.person.lastName,
          lastNamePrefix: schema.person.lastNamePrefix,
          dateOfBirth: schema.person.dateOfBirth,
          birthCity: schema.person.birthCity,
          handle: schema.person.handle,
        })
        .from(schema.person)
        .where(
          and(
            eq(schema.person.handle, handle.trim()),
            exists(
              db
                .select({ id: sql`1` })
                .from(schema.actor)
                .where(
                  and(
                    eq(schema.actor.personId, schema.person.id),
                    eq(schema.actor.locationId, locationId),
                    eq(schema.actor.type, "instructor"),
                  ),
                ),
            ),
          ),
        );

      if (persons.length === 0) {
        console.log(`❌ No instructor found with handle: ${handle}`);
        skippedCount++;
        processedIndices.add(skippedRow.rowIndex);
        continue;
      }

      if (persons.length > 1) {
        console.log(`⚠️ Multiple persons found with handle: ${handle}`);
        const { selectedPersonId } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedPersonId",
            message: "Which person is correct?",
            choices: persons.map((person) => ({
              name: `${person.firstName} ${person.lastNamePrefix || ""} ${person.lastName || ""} | DOB: ${person.dateOfBirth || "Unknown"} | City: ${person.birthCity || "Unknown"}`.trim(),
              value: person.id,
            })),
          },
        ]);
        personId = selectedPersonId;
      } else {
        const person = persons[0];
        if (!person) {
          console.error("❌ Unexpected: No person in array");
          skippedCount++;
          processedIndices.add(skippedRow.rowIndex);
          continue;
        }
        console.log(
          `✅ Found: ${person.firstName} ${person.lastNamePrefix || ""} ${person.lastName || ""}`,
        );
        personId = person.id;
      }
    } else if (action === "search") {
      // Search by name only, ignoring other fields
      const db = useQuery();
      const persons = await db
        .select({
          id: schema.person.id,
          firstName: schema.person.firstName,
          lastName: schema.person.lastName,
          lastNamePrefix: schema.person.lastNamePrefix,
          dateOfBirth: schema.person.dateOfBirth,
          birthCity: schema.person.birthCity,
          handle: schema.person.handle,
        })
        .from(schema.person)
        .where(
          and(
            eq(schema.person.firstName, row.Voornaam as string),
            eq(schema.person.lastName, row.Achternaam as string),
            row.Tussenvoegsel
              ? eq(schema.person.lastNamePrefix, row.Tussenvoegsel)
              : isNull(schema.person.lastNamePrefix),
            exists(
              db
                .select({ id: sql`1` })
                .from(schema.actor)
                .where(
                  and(
                    eq(schema.actor.personId, schema.person.id),
                    eq(schema.actor.locationId, locationId),
                    eq(schema.actor.type, "instructor"),
                  ),
                ),
            ),
          ),
        );

      if (persons.length === 0) {
        console.log("❌ No person found with that name.");
        skippedCount++;
        processedIndices.add(skippedRow.rowIndex);
        continue;
      }

      const { selectedPersonId } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedPersonId",
          message: "Select the correct person:",
          choices: [
            ...persons.map((person) => ({
              name: `${person.firstName} ${person.lastNamePrefix || ""} ${person.lastName || ""} | DOB: ${person.dateOfBirth || "Unknown"} | City: ${person.birthCity || "Unknown"} | Handle: ${person.handle || "Unknown"}`.trim(),
              value: person.id,
            })),
            {
              name: "❌ None of these (skip)",
              value: null,
            },
          ],
        },
      ]);

      if (selectedPersonId === null) {
        console.log("Row skipped.");
        skippedCount++;
        processedIndices.add(skippedRow.rowIndex);
        continue;
      }

      personId = selectedPersonId;
    }

    if (personId) {
      // Find all other skipped rows that match the same person
      const matchingRows = noPersonFoundRows.filter((otherRow) => {
        if (processedIndices.has(otherRow.rowIndex)) {
          return false;
        }
        const otherRowData = otherRow.data as z.infer<typeof rowSchema>;
        return (
          otherRowData.Voornaam === row.Voornaam &&
          otherRowData.Achternaam === row.Achternaam &&
          otherRowData.Tussenvoegsel === row.Tussenvoegsel
        );
      });

      console.log(
        `\n🔍 Found ${matchingRows.length} rows for the same person.`,
      );

      if (matchingRows.length > 1) {
        const { processAll } = await inquirer.prompt([
          {
            type: "confirm",
            name: "processAll",
            message: `Process all ${matchingRows.length} rows for this person?`,
            default: true,
          },
        ]);

        if (processAll) {
          console.log(`\n📋 Processing all rows for ${fullName}:`);
          for (const matchingRow of matchingRows) {
            const matchingRowData = matchingRow.data as z.infer<
              typeof rowSchema
            >;
            console.log(
              `  - Row ${matchingRow.rowIndex}: ${matchingRowData["Kwalificatie: Naam van Kwalificatie"]} (${matchingRowData["Hoogste Geldigheids Niveau"]})`,
            );
          }
        } else {
          // Only process the current row
          matchingRows.splice(0, matchingRows.length);
          matchingRows.push(skippedRow);
        }
      }

      // Process all matching rows
      let batchProcessedCount = 0;
      for (const matchingRow of matchingRows) {
        try {
          const matchingRowData = matchingRow.data as z.infer<typeof rowSchema>;
          await processRowWithPersonId(
            matchingRowData,
            personId,
            matchingRow.rowIndex,
          );
          console.log(`✅ Row ${matchingRow.rowIndex} processed successfully!`);
          batchProcessedCount++;
          processedIndices.add(matchingRow.rowIndex);

          // Update cache for this row
          const cacheKey = createPersonCacheKey(
            matchingRowData.Voornaam as string,
            matchingRowData.Achternaam as string,
            matchingRowData.Tussenvoegsel,
            matchingRowData.Geboortedatum ?? null,
            matchingRowData.Geboorteplaats,
            locationId,
          );
          personCache.set(cacheKey, personId);
        } catch (error) {
          console.error(
            `❌ Error processing row ${matchingRow.rowIndex}:`,
            error,
          );
        }
      }

      console.log(
        `\n✅ Batch complete: ${batchProcessedCount} rows processed for ${fullName}`,
      );
      processedCount += batchProcessedCount;
    }
  }

  console.log("\n=== REPROCESSING SUMMARY ===");
  console.log(`✅ Successfully processed: ${processedCount} rows`);
  console.log(`❌ Skipped: ${skippedCount} rows`);
  console.log("===============================\n");
}

async function main(filePath: string) {
  const csvRows = await parseCsv(filePath);

  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "To which location would you like to add students?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
  ]);

  // First, validate and parse all rows
  console.log("\n=== VALIDATION PHASE ===");
  const validationResult = await validateAndParseRows(csvRows);

  if (validationResult.validRows.length === 0) {
    console.log("No valid rows to process. Exiting.");
    return;
  }

  // Ask user whether to continue with processing
  const { shouldContinue } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldContinue",
      message: `Found ${validationResult.validRows.length} valid rows and ${validationResult.invalidRows.length} invalid rows. Do you want to continue with processing the valid rows?`,
      default: true,
    },
  ]);

  if (!shouldContinue) {
    console.log("Processing cancelled by user. Exiting.");
    return;
  }

  // Then proceed with batch processing
  console.log("\n=== PROCESSING PHASE ===");
  console.log(
    `Proceeding with ${validationResult.validRows.length} valid rows...`,
  );
  await processRows(validationResult.validRows, location);

  // Write skipped rows report after processing
  await writeSkippedRowsReport(filePath);

  // Show final summary
  console.log("\n=== FINAL SUMMARY ===");
  console.log(`📊 Total rows in file: ${validationResult.totalRows}`);
  console.log(
    `✅ Successfully processed: ${validationResult.validRows.length - skippedRows.filter((r) => r.reason.startsWith("Validation error")).length}`,
  );
  console.log(`❌ Skipped rows: ${skippedRows.length}`);
  console.log("📄 Detailed report written to file");
  console.log("====================\n");

  // Offer to reprocess skipped rows
  if (
    skippedRows.filter(
      (r) =>
        r.reason === "No person found" ||
        r.reason === "No person found (cached)",
    ).length > 0
  ) {
    await reprocessSkippedPersons(skippedRows, location);
  }
}

const pgUri = process.env.PGURI;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(pgUri, "PGURI environment variable is required");
assert(
  supabaseUrl,
  "NEXT_PUBLIC_SUPABASE_URL environment variable is required",
);
assert(
  supabaseKey,
  "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
);

withSupabaseClient(
  {
    url: supabaseUrl,
    serviceRoleKey: supabaseKey,
  },
  () =>
    withDatabase(
      {
        connectionString: pgUri,
      },
      async () => {
        // Get the file path from the command-line arguments
        const filePath = process.argv[2];

        // Check if the file path was provided
        if (!filePath) {
          console.log("Please provide a file path.");
          process.exit(1);
        }

        await main(filePath);
      },
    )
      .then(() => {
        console.log("Done!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      }),
);
