import { Location, User, withDatabase, withSupabaseClient } from "@nawadi/core";
import csv from "csvtojson";
import "dotenv/config";
import assert from "node:assert";
import path from "node:path";
import inquirer from "inquirer";
import { z } from "zod";

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

async function main(filePath: string) {
  const csvRows = await parseCsv(filePath);

  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "To which location would you like to add instructors?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
  ]);

  const rowSchema = z.object({
    "CWO Pasnummer": z.string().trim().nullable(),
    Voornaam: z.string().trim().nullable(),
    Tussenvoegsel: z.string().trim().nullable(),
    Achternaam: z.string().trim().nullable(),
    Geboorteplaats: z.string().trim().nullable(),
    Geboortedatum: z
      .string()
      .nullable()
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
    "E-mail": z.string().trim().toLowerCase().email().nullable(),
  });

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

  for await (const row of rows) {
    if (!row.Voornaam || !row.Achternaam) {
      console.error("Skipping row, missing first name or last name:", row);
      continue;
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let user;

    if (row["E-mail"]) {
      user = await User.getOrCreateFromEmail({
        email: row["E-mail"],
        displayName: row.Voornaam,
      });
    }

    const person = await User.Person.getOrCreate({
      userId: user?.id,
      firstName: row.Voornaam,
      lastName: row.Achternaam,
      lastNamePrefix: row.Tussenvoegsel,
      dateOfBirth: row.Geboortedatum,
      birthCity: row.Geboorteplaats,
      birthCountry: "nl",
    }).catch((error) => {
      console.error("Error creating person:", error, row);
      throw error;
    });

    if (row["CWO Pasnummer"]) {
      await User.Person.replaceMetadata({
        personId: person.id,
        metadata: {
          cwo: {
            pasnummer: row["CWO Pasnummer"],
          },
        },
      });
    }

    await User.Person.createLocationLink({
      personId: person.id,
      locationId: location,
    });

    await User.Actor.upsert({
      locationId: location,
      type: "instructor",
      personId: person.id,
    });
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
