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
import { arrayContains, sql } from "drizzle-orm";
import inquirer from "inquirer";
import { chunk } from "lodash-es";
import pThrottle from "p-throttle";
import { z } from "zod";

const BATCH_SIZE = 100;
const OPERATIONS_PER_SECOND = 10;

const throttledProcess = pThrottle({
  interval: 1000,
  limit: OPERATIONS_PER_SECOND,
})(processRow);

const rowSchema = z.object({
  "CWO-id": z.string().trim(),
  DiplomaNummer: z.string().trim(),
  Opleiding: z.string().trim(),
  DatumBehaald: z.string().transform((val, ctx) => {
    // Split the date string into components
    const [day, month, year] = val.split("-").map(Number);

    if (!day || !month || !year) {
      ctx.addIssue({
        code: "invalid_date",
        message: "Invalid date format",
      });
      return z.NEVER;
    }

    // Create a new Date object
    const date = new Date(year, month - 1, day);

    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: "invalid_date",
        message: "Invalid date",
      });
      return z.NEVER;
    }

    // Convert to ISO date string
    const isoDateStr = date.toISOString();

    return isoDateStr;
  }),
});

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
  for (const batch of batches) {
    index++;
    console.log(`Processing batch ${index} of ${batches.length} ...`);
    const result = await Promise.allSettled(
      batch.map((chunk) => throttledProcess(chunk, locationId)),
    );

    console.log(`Batch processed: ${result.length} items`);
    const errors = result.filter((r) => r.status === "rejected");
    console.log(`Errors: ${errors.length}`);
    totalErrors += errors.length;
  }

  if (totalErrors > 0) {
    console.error(`Total errors: ${totalErrors}`);
  }
}

async function processRow(row: z.infer<typeof rowSchema>, locationId: string) {
  const query = useQuery();

  const persons = await query
    .select({ id: schema.person.id })
    .from(schema.person)
    .where(arrayContains(sql`_metadata->'cwo'->'ids'`, [row["CWO-id"]]));

  if (persons.length === 0) {
    console.error("Person not found:", row);

    throw new Error("Person not found");
  }

  if (persons.length > 1) {
    console.error("Multiple persons found:", row);

    throw new Error("Multiple persons found");
  }

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const person = persons[0]!;

  await query.insert(schema.externalCertificate).values({
    personId: person.id,
    locationId,
    identifier: row.DiplomaNummer,
    awardedAt: row.DatumBehaald,
    _metadata: sql`(((${JSON.stringify({
      Uitgever: "CWO",
      Opleiding: row.Opleiding,
    })})::jsonb)#>> '{}')::jsonb`,
  });
}

async function main(filePath: string) {
  const csvRows = await parseCsv(filePath);

  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message:
        "To which location would you like to associate the certificates?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
  ]);

  const rows = rowSchema.array().parse(
    csvRows
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
      }),
  );

  await processRows(rows, location);
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
        pgUri,
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
