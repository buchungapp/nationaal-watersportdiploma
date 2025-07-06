import {
  Location,
  useQuery,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { schema } from "@nawadi/db";
import csv from "csvtojson";
import "dotenv/config";
import assert from "node:assert";
import path from "node:path";
import { and, eq, exists, inArray, isNull, sql } from "drizzle-orm";
import inquirer from "inquirer";
import { chunk } from "lodash-es";
import pThrottle from "p-throttle";
import { z } from "zod";

const BATCH_SIZE = 100;
const OPERATIONS_PER_SECOND = 10;

// Cache for person lookups to avoid redundant database queries
const personCache = new Map<string, string | null>();

const throttledProcess = pThrottle({
  interval: 1000,
  limit: OPERATIONS_PER_SECOND,
})((row: z.infer<typeof rowSchema>, locationId: string, rowIndex?: number) =>
  processRow(row, locationId, rowIndex),
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
  ]),
  "Hoogste Geldigheids Niveau": z.enum([
    "2",
    "3",
    "4",
    "4*",
    "5*",
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
      courseId: string | null;
    }
> = {
  "Eigen vaardigheid - Catamaran": {
    _type: "eigenvaardigheid",
    courseId: "50e1e7c0-791e-4e86-8825-6a0f6575837e",
  },
  "Eigen vaardigheid - Jachtzeilen Non Tidal": {
    _type: "eigenvaardigheid",
    courseId: null,
  },
  "Eigen vaardigheid - Jachtzeilen Tidal": {
    _type: "eigenvaardigheid",
    courseId: null,
  },
  "Eigen vaardigheid - Kajuitzeilen": {
    _type: "eigenvaardigheid",
    courseId: null,
  },
  "Eigen vaardigheid - Kielboot": {
    _type: "eigenvaardigheid",
    courseId: "5b50a748-cdcd-4541-9303-2aaefe2e19d8",
  },
  "Eigen vaardigheid - Windsurfen": {
    _type: "eigenvaardigheid",
    courseId: "19a0d0b4-71e2-46dd-8a64-e9e5daef1e18",
  },
  "Eigen vaardigheid - Zwaardboot eenmans": {
    _type: "eigenvaardigheid",
    courseId: "ca6dd2f2-0dc2-490d-86a9-96894b6332ea",
  },
  "Eigen vaardigheid - Zwaardboot tweemans": {
    _type: "eigenvaardigheid",
    courseId: "99558cab-5797-4cde-9e7d-5dc85460048a",
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

async function processRows(
  rows: z.infer<typeof rowSchema>[],
  locationId: string,
) {
  // Process rows in batches
  const batches = chunk(rows, BATCH_SIZE);

  let index = 0;
  let totalErrors = 0;
  let totalProcessed = 0;

  for (const batch of batches) {
    index++;
    console.log(`Processing batch ${index} of ${batches.length} ...`);

    const result = await Promise.allSettled(
      batch.map((chunk, chunkIndex) =>
        throttledProcess(
          chunk,
          locationId,
          (index - 1) * BATCH_SIZE + chunkIndex + 1,
        ),
      ),
    );

    const errors = result.filter((r) => r.status === "rejected");
    const successes = result.filter((r) => r.status === "fulfilled");

    console.log(`Batch processed: ${result.length} items`);
    console.log(`✅ Successful: ${successes.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    // Log detailed error information
    if (errors.length > 0) {
      console.log("\n--- Batch Error Details ---");
      errors.forEach((error, errorIndex) => {
        const rowIndex = (index - 1) * BATCH_SIZE + errorIndex + 1;
        console.error(`Error in row ${rowIndex}:`);
        console.error(
          `  Message: ${error.reason instanceof Error ? error.reason.message : String(error.reason)}`,
        );
        if (error.reason instanceof Error && error.reason.stack) {
          console.error(
            `  Stack: ${error.reason.stack.split("\n").slice(0, 3).join("\n")}`,
          );
        }
        console.error("---");
      });
      console.log("--- End Batch Error Details ---\n");
    }

    totalErrors += errors.length;
    totalProcessed += successes.length;
  }

  console.log("\n=== FINAL SUMMARY ===");
  console.log(`✅ Total processed successfully: ${totalProcessed}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log(`📊 Total rows attempted: ${rows.length}`);
  console.log("====================\n");

  // Report cache statistics after processing all rows
  reportCacheStats();
}

async function processRow(
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
      return;
    }

    if (persons.length > 1) {
      // Multiple persons found - ask user to select the correct one
      console.log(`\n🤔 ${rowInfo}Multiple persons found for row:`);
      const fullName = [row.Voornaam, row.Tussenvoegsel, row.Achternaam]
        .filter(Boolean)
        .join(" ");
      console.log(`Name: ${fullName}`);
      console.log(`Date of Birth: ${row.Geboortedatum || "Not provided"}`);
      console.log(`Birth City: ${row.Geboorteplaats || "Not provided"}`);
      console.log(
        `Qualification: ${row["Kwalificatie: Naam van Kwalificatie"]}`,
      );
      console.log(`Level: ${row["Hoogste Geldigheids Niveau"]}`);

      // Get additional person details for better selection using the IDs we already found
      const personIds = persons.map((person) => person.id);
      const personsWithDetails = await db
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
        .where(inArray(schema.person.id, personIds));

      const { selectedPersonId } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedPersonId",
          message: `Which person matches ${rowInfo.trim() || "this row"}?`,
          choices: [
            ...personsWithDetails.map((person) => ({
              name: `${person.firstName} ${person.lastNamePrefix || ""} ${person.lastName} | DOB: ${person.dateOfBirth || "Unknown"} | City: ${person.birthCity || "Unknown"} | Handle: ${person.handle || "Unknown"}`.trim(),
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
        personCache.set(cacheKey, null);
        console.log(`${rowInfo}Skipping row as requested by user`);
        return;
      }

      // Store the user's selection in cache
      personCache.set(cacheKey, selectedPersonId);
      personId = selectedPersonId;
    }

    // biome-ignore lint/style/noNonNullAssertion: We know there is only one person
    personId = persons[0]!.id;
    // Store successful result in cache
    personCache.set(cacheKey, personId);
  } else if (personId === null) {
    // Cache hit with null value (previous failed lookup)
    cacheHits++;
    console.error(`${rowInfo}Skipping row, cached failed lookup:`, row);
    return;
  } else {
    // Cache hit with valid person ID
    cacheHits++;
  }

  // Use the cached or freshly queried person ID
  const person = { id: personId };

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
    console.log(`${rowInfo}Skipping row, no KSS qualification found`);
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
          personId: person.id,
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
    await db
      .insert(schema.persoonKwalificatie)
      .values(valuesToInsert)
      .onConflictDoNothing();
  }
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

  console.log(`Total rows to validate: ${cleanedRows.length}`);

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

  if (validRows.length === 0) {
    console.log("No valid rows to process. Exiting.");
    return;
  }

  console.log(`Proceeding with ${validRows.length} valid rows...`);
  await processRows(validRows, location);
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
