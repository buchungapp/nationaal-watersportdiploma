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
  const entries = await parseCsv(filePath);

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

  const rowSchema = z.object({
    "E-mailadres": z.string().trim().toLowerCase().email(),
    Voornaam: z.string().trim(),
    Tussenvoegsels: z
      .string()
      .trim()
      .transform((tussenvoegsel) =>
        tussenvoegsel === "" ? null : tussenvoegsel,
      ),
    Achternaam: z.string(),
    Geboortedatum: z.string().pipe(z.coerce.date()),
    Geboorteplaats: z.string(),
    Geboorteland: z
      .string()
      .length(2)
      .catch(() => "nl"),
  });

  const rows = rowSchema.array().parse(
    entries.filter((entry) => {
      // At least one value is required
      return Object.values(entry).some((value) => value !== "");
    }),
  );

  for await (const row of rows) {
    const user = await User.getOrCreateFromEmail({
      email: row["E-mailadres"],
      displayName: row.Voornaam,
    });

    const person = await User.Person.getOrCreate({
      userId: user.id,
      firstName: row.Voornaam,
      lastName: row.Achternaam,
      lastNamePrefix: row.Tussenvoegsels,
      dateOfBirth: row.Geboortedatum.toISOString(),
      birthCity: row.Geboorteplaats,
      birthCountry: row.Geboorteland,
    });

    await User.Person.createLocationLink({
      personId: person.id,
      locationId: location,
    });

    await User.Actor.upsert({
      locationId: location,
      type: "student",
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
